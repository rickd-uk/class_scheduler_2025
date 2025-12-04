import ApiService from "./ApiService";

const CHANGE_PASSWORD_ENDPOINT = "/users/change-password";

const UserService = {
  changePassword(passwords) {
    // passwords should be an object like { currentPassword: '...', newPassword: '...' }
    console.log(
      `UserService: Sending change password request to ${CHANGE_PASSWORD_ENDPOINT}`,
    );
    return ApiService.put(CHANGE_PASSWORD_ENDPOINT, passwords);
  },
};

export default UserService;
