import { createStore } from 'vuex'
import auth from './modules/auth'
import classes from './modules/classes'
import textbooks from './modules/textbooks'
import schedule from './modules/schedule'
import templates from './modules/templates'
import daysOff from './modules/daysOff'
import schoolYear from './modules/schoolYear'
import ui from './modules/ui'

export default createStore({
  modules: {
    auth,
    classes,
    textbooks,
    schedule,
    templates,
    daysOff,
    schoolYear,
    ui
  },
  // Optional: Add root state/getters/mutations/actions if needed
  // state: {},
  // getters: {},
  // mutations: {},
  // actions: {},
})

