import ScheduleService from "../../services/ScheduleService";
import AppliedExceptionsService from "../../services/AppliedExceptionsService";

export default {
  namespaced: true,

  state: () => ({
    regularSchedule: {},
    dailyExceptions: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    // raw data
    regularSchedule: (state) => state.regularSchedule,
    appliedExceptions: (state) => state.dailyExceptions,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,

    // fill out to exactly 6 periods
    getScheduleForDay: (state) => (dayOfWeek) => {
      const day = dayOfWeek.toLowerCase();
      const schedule = state.regularSchedule[day] || [];
      return [
        ...schedule,
        ...Array(Math.max(0, 6 - schedule.length)).fill(null),
      ].slice(0, 6);
    },

    getAppliedExceptionForDate: (state) => (dateString) =>
      state.dailyExceptions.find((e) => e.date === dateString),

    mergedSchedule: (state, _getters, rootState, rootGetters) => {
      // start from a deep‐clone of the regular grid
      const schedule = JSON.parse(JSON.stringify(state.regularSchedule));

      const applyGlobalDaysOff =
        rootGetters["globalSettings/shouldApplyGlobalDaysOff"];
      const applyGlobalExceptions =
        rootGetters["globalSettings/shouldApplyGlobalExceptions"];
      const globalDaysOffList = rootGetters["globalDaysOff/allGlobalDaysOff"];
      const globalExceptionsList =
        rootGetters["globalAppliedExceptions/allGlobalExceptions"];
      const personalExceptionsList = state.dailyExceptions;

      const dateToWeekday = (ds) => {
        const d = new Date(ds + "T12:00:00");
        return d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      };

      // 1) apply global days off
      if (applyGlobalDaysOff) {
        globalDaysOffList.forEach(({ date }) => {
          const wd = dateToWeekday(date);
          schedule[wd] = Array(6).fill(null);
        });
      }

      // 2) overlay global exceptions
      if (applyGlobalExceptions) {
        globalExceptionsList.forEach((exc) => {
          const wd = dateToWeekday(exc.date);
          if (!schedule[wd]) return;

          if (exc.isDayOff) {
            // full wipe
            schedule[wd] = Array(6).fill(null);
          } else if (exc.exceptionPatternId) {
            // pattern: remap from the regularSchedule
            const original = state.regularSchedule[wd] || [];
            schedule[wd] = exc.ExceptionPattern.patternData.map(
              (origPeriod) => {
                if (origPeriod == null) return null;
                const slot = original[origPeriod - 1];
                return slot ? { classId: slot.classId } : null;
              },
            );
          } else {
            // ad‐hoc single period override
            schedule[wd] = schedule[wd].map((slot, idx) =>
              idx === exc.periodIndex
                ? { classId: exc.classId, notes: exc.reason }
                : slot,
            );
          }
        });
      }

      // 3) overlay personal (user) exceptions
      personalExceptionsList.forEach((exc) => {
        const wd = dateToWeekday(exc.date);
        if (!schedule[wd]) return;

        if (exc.isDayOff) {
          schedule[wd] = Array(6).fill(null);
        } else if (exc.exceptionPatternId) {
          const original = state.regularSchedule[wd] || [];
          schedule[wd] = exc.ExceptionPattern.patternData.map((origPeriod) => {
            if (origPeriod == null) return null;
            const slot = original[origPeriod - 1];
            return slot ? { classId: slot.classId } : null;
          });
        } else {
          schedule[wd] = schedule[wd].map((slot, idx) =>
            idx === exc.periodIndex
              ? { classId: exc.classId, notes: exc.reason }
              : slot,
          );
        }
      });

      return schedule;
    },
  },

  mutations: {
    SET_REGULAR_SCHEDULE(state, raw) {
      const formatted = {};
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const periods = 6;
      days.forEach((day) => {
        formatted[day] = Array(periods).fill(null);
        const arr = raw?.[day];
        if (Array.isArray(arr)) {
          for (let i = 0; i < Math.min(periods, arr.length); i++) {
            formatted[day][i] = arr[i];
          }
        }
      });
      state.regularSchedule = formatted;
    },

    SET_APPLIED_EXCEPTIONS(state, exceptions) {
      state.dailyExceptions = exceptions
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));
    },

    SET_APPLIED_EXCEPTION(state, one) {
      const idx = state.dailyExceptions.findIndex((e) => e.date === one.date);
      if (idx >= 0) {
        state.dailyExceptions.splice(idx, 1, one);
      } else {
        state.dailyExceptions.push(one);
        state.dailyExceptions.sort((a, b) => a.date.localeCompare(b.date));
      }
    },

    CLEAR_APPLIED_EXCEPTION(state, date) {
      state.dailyExceptions = state.dailyExceptions.filter(
        (e) => e.date !== date,
      );
    },

    SET_LOADING(state, val) {
      state.isLoading = val;
    },
    SET_ERROR(state, err) {
      state.error = err;
      state.isLoading = false;
    },
    RESET_STATE(state) {
      state.regularSchedule = {};
      state.dailyExceptions = [];
      state.isLoading = false;
      state.error = null;
    },
  },

  actions: {
    async fetchRegularSchedule({ commit, state }) {
      if (state.isLoading) return;
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await ScheduleService.getRegular();
        commit("SET_REGULAR_SCHEDULE", data || {});
      } catch (err) {
        commit("SET_ERROR", err.response?.data?.message || err.message);
        commit("SET_REGULAR_SCHEDULE", {});
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchAppliedExceptions({ commit, state }) {
      if (state.isLoading) return;
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await AppliedExceptionsService.getAll();
        commit("SET_APPLIED_EXCEPTIONS", data);
      } catch (err) {
        commit("SET_ERROR", err.response?.data?.message || err.message);
        commit("SET_APPLIED_EXCEPTIONS", []);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async updateRegularSchedule({ commit, dispatch }, newSched) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await ScheduleService.updateRegular(newSched);
        commit("SET_REGULAR_SCHEDULE", data);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Schedule updated." },
          { root: true },
        );
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        commit("SET_ERROR", msg);
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async applyException({ commit, dispatch }, payload) {
      commit("SET_ERROR", null);
      try {
        const { data } = await AppliedExceptionsService.apply(payload);
        commit("SET_APPLIED_EXCEPTION", data);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Exception applied." },
          { root: true },
        );
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      }
    },

    async clearAppliedException({ commit, dispatch }, date) {
      commit("SET_ERROR", null);
      try {
        await AppliedExceptionsService.clear(date);
        commit("CLEAR_APPLIED_EXCEPTION", date);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Exception cleared." },
          { root: true },
        );
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      }
    },
  },
};
