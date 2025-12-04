import { createStore } from "vuex";

import auth from "./modules/auth";
import classes from "./modules/classes";
import textbooks from "./modules/textbooks";
import schedule from "./modules/schedule";
import templates from "./modules/templates";
import daysOff from "./modules/daysOff";
import exceptionPatterns from "./modules/exceptionPatterns";
import schoolYear from "./modules/schoolYear";
import ui from "./modules/ui";

// ← NEW
import globalDaysOff from "./modules/globalDaysOff";
import globalAppliedExceptions from "./modules/globalAppliedExceptions";
import globalSettings from "./modules/globalSettings";
import user from "./modules/user";

// Log registered modules for debugging purposes
console.log("Registering Vuex modules:", {
  auth,
  classes,
  textbooks,
  schedule,
  templates,
  daysOff,
  schoolYear,
  ui,
  exceptionPatterns,
  globalDaysOff,
  globalAppliedExceptions,
  globalSettings,
  user,
});

export default createStore({
  modules: {
    auth,
    classes,
    textbooks,
    schedule,
    templates,
    daysOff,
    exceptionPatterns,
    schoolYear,
    ui,

    // REGISTER YOUR GLOBAL MODULES HERE
    globalDaysOff,
    globalAppliedExceptions,
    globalSettings,
    user,
  },
});
