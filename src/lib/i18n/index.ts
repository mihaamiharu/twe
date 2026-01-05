import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './resources/en/common.json';
import commonId from './resources/id/common.json';
import homeEn from './resources/en/home.json';
import homeId from './resources/id/home.json';
import challengesEn from './resources/en/challenges.json';
import challengesId from './resources/id/challenges.json';
import tutorialsEn from './resources/en/tutorials.json';
import tutorialsId from './resources/id/tutorials.json';
import leaderboardEn from './resources/en/leaderboard.json';
import leaderboardId from './resources/id/leaderboard.json';
import legalEn from './resources/en/legal.json';
import legalId from './resources/id/legal.json';
import authEn from './resources/en/auth.json';
import authId from './resources/id/auth.json';
import bugsEn from './resources/en/bugs.json';
import bugsId from './resources/id/bugs.json';

const resources = {
    en: {
        common: commonEn,
        home: homeEn,
        challenges: challengesEn,
        tutorials: tutorialsEn,
        leaderboard: leaderboardEn,
        auth: authEn,
        bugs: bugsEn,
        legal: legalEn,
    },
    id: {
        common: commonId,
        home: homeId,
        challenges: challengesId,
        tutorials: tutorialsId,
        leaderboard: leaderboardId,
        auth: authId,
        bugs: bugsId,
        legal: legalId,
    },
};

void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    ns: ['common', 'home', 'challenges', 'tutorials', 'leaderboard', 'auth', 'bugs', 'legal'],
    defaultNS: 'common',
});

export default i18n;
