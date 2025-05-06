// client/src/store/modules/schedule.js

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

    // single-date exception
    getAppliedExceptionForDate: (state) => (dateString) => {
      return state.dailyExceptions.find((e) => e.date === dateString);
    },

    // merged schedule with global days-off and global exceptions
    mergedSchedule: (state, _getters, rootState, rootGetters) => {
      // 1) deep-clone the base weekday-keyed schedule
      const schedule = JSON.parse(JSON.stringify(state.regularSchedule));

      // 2) pull in the toggles
      const applyGlobalDaysOff =
        rootGetters["globalSettings/shouldApplyGlobalDaysOff"];
      const applyGlobalExceptions =
        rootGetters["globalSettings/shouldApplyGlobalExceptions"];

      // 3) pull in the global lists
      const globalDaysOffList = rootGetters["globalDaysOff/allGlobalDaysOff"];
      const globalExceptionsList =
        rootGetters["globalAppliedExceptions/allGlobalExceptions"];

      // 4) helper to map a YYYY-MM-DD to a weekday key
      const dateToWeekday = (ds) => {
        const d = new Date(ds + "T12:00:00"); // midday avoids timezone shifts
        return d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      };

      // 5) apply global days off (wipe out entire day)
      if (applyGlobalDaysOff) {
        globalDaysOffList.forEach(({ date }) => {
          const wd = dateToWeekday(date);
          if (schedule[wd]) {
            schedule[wd] = [];
          }
        });
      }

      // 6) apply global exceptions (push exception items)
      if (applyGlobalExceptions) {
        globalExceptionsList.forEach((exc) => {
          const wd = dateToWeekday(exc.date);
          if (schedule[wd]) {
            schedule[wd].push(exc);
          }
        });
      }

      // 7) apply user-specific exceptions last
      state.dailyExceptions.forEach((exc) => {
        const wd = dateToWeekday(exc.date);
        if (schedule[wd]) {
          schedule[wd].push(exc);
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
