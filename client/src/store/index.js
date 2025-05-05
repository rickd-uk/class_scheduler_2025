import { createStore } from "vuex";
import auth from "./modules/auth";
import classes from "./modules/classes";
import textbooks from "./modules/textbooks";
import schedule from "./modules/schedule";
import templates from "./modules/templates";
import daysOff from "./modules/daysOff";
import schoolYear from "./modules/schoolYear";
import ui from "./modules/ui";
import exceptionPatterns from "./modules/exceptionPatterns";
import globalDaysOff from "./modules/globalDaysOff";
import globalAppliedExceptions from "./modules/globalAppliedExceptions";

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
  exceptionPatterns, // <-- Add to log
});

// Create and export the Vuex store instance
export default createStore({
  modules: {
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
  },
  // Optional: Add root state/getters/mutations/actions if needed globally
  // state: {},
  // getters: {},
  // mutations: {},
  // actions: {},
});
