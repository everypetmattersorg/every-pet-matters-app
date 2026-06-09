/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import Adopt from './pages/Adopt';
import Alerts from './pages/Alerts';
import Community from './pages/Community';
import CreateEvent from './pages/CreateEvent';
import Discounts from './pages/Discounts';
import Donations from './pages/Donations';
import Events from './pages/Events';
import FinalizeAdoption from './pages/FinalizeAdoption';
import Home from './pages/Home';
import LostAndFound from './pages/LostAndFound';

import ManageDonationCampaigns from './pages/ManageDonationCampaigns';
import MyAdoptedPets from './pages/MyAdoptedPets';
import MyPets from './pages/MyPets';
import MyPetsHub from './pages/MyPetsHub';
import MyReportedPets from './pages/MyReportedPets';
import PetDetails from './pages/PetDetails';
import Preferences from './pages/Preferences';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Recommendations from './pages/Recommendations';
import ReportFound from './pages/ReportFound';
import ReportLost from './pages/ReportLost';
import RescueAIAssistant from './pages/RescueAIAssistant';
import RescueDashboard from './pages/RescueDashboard';
import RescueDirectory from './pages/RescueDirectory';
import RescueProfile from './pages/RescueProfile';
import RescueProfileSettings from './pages/RescueProfileSettings';
import Resources from './pages/Resources';
import Services from './pages/Services';
import Urgent from './pages/Urgent';
import UserProfile from './pages/UserProfile';
import Volunteer from './pages/Volunteer';
import FosterNetwork from './pages/FosterNetwork';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Adopt": Adopt,
    "Alerts": Alerts,
    "Community": Community,
    "CreateEvent": CreateEvent,
    "Discounts": Discounts,
    "Donations": Donations,
    "Events": Events,
    "FinalizeAdoption": FinalizeAdoption,
    "Home": Home,
    "LostAndFound": LostAndFound,

    "ManageDonationCampaigns": ManageDonationCampaigns,
    "MyAdoptedPets": MyAdoptedPets,
    "MyPets": MyPets,
    "MyPetsHub": MyPetsHub,
    "MyReportedPets": MyReportedPets,
    "PetDetails": PetDetails,
    "Preferences": Preferences,
    "Profile": Profile,
    "PublicProfile": PublicProfile,
    "Recommendations": Recommendations,
    "ReportFound": ReportFound,
    "ReportLost": ReportLost,
    "RescueAIAssistant": RescueAIAssistant,
    "RescueDashboard": RescueDashboard,
    "RescueDirectory": RescueDirectory,
    "RescueProfile": RescueProfile,
    "RescueProfileSettings": RescueProfileSettings,
    "Resources": Resources,
    "Services": Services,
    "Urgent": Urgent,
    "UserProfile": UserProfile,
    "Volunteer": Volunteer,
    "FosterNetwork": FosterNetwork,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};