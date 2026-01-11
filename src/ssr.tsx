import { createStartHandler } from '@tanstack/react-start/server'
import { getRouter } from './router'

export default createStartHandler({
    createRouter: () => getRouter(),
});
