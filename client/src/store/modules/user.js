// client/src/store/modules/user.js
import UserService from "../../services/UserService";

export default {
  namespaced: true,

  state: () => ({
    isChangingPassword: false,
    passwordChangeError: null,
    passwordChangeSuccess: false,
  }),

  getters: {
    isChangingPassword: (state) => state.isChangingPassword,
    passwordChangeError: (state) => state.passwordChangeError,
    passwordChangeSuccess: (state) => state.passwordChangeSuccess,
  },

  mutations: {
    PASSWORD_CHANGE_REQUEST(state) {
      state.isChangingPassword = true;
      state.passwordChangeError = null;
      state.passwordChangeSuccess = false;
    },
    PASSWORD_CHANGE_SUCCESS(state) {
      state.isChangingPassword = false;
      state.passwordChangeError = null;
      state.passwordChangeSuccess = true;
    },
    PASSWORD_CHANGE_ERROR(state, error) {
      state.isChangingPassword = false;
      state.passwordChangeError = error;
      state.passwordChangeSuccess = false;
    },
    CLEAR_PASSWORD_CHANGE_STATUS(state) {
      state.passwordChangeError = null;
      state.passwordChangeSuccess = false;
    },
  },

  actions: {
    async changePassword({ commit }, passwords) {
      commit("PASSWORD_CHANGE_REQUEST");
      try {
        console.log("Attempting password change via API");
        const response = await UserService.changePassword(passwords);

        commit("PASSWORD_CHANGE_SUCCESS");
        console.log("Password changed successfully");
        return response;
      } catch (error) {
        console.error("Password change action failed:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Password change failed.";
        commit("PASSWORD_CHANGE_ERROR", errorMessage);
        throw new Error(errorMessage);
      }
    },

    clearPasswordChangeStatus({ commit }) {
      commit("CLEAR_PASSWORD_CHANGE_STATUS");
    },
  },
};
