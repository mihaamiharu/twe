import { queryOptions } from '@tanstack/react-query';
import { getWorkshopsFn, getWorkshopFn, getWorkshopModuleFn } from '@/server/workshops.fn';

export const workshopsListQueryOptions = (locale: string) =>
    queryOptions({
        queryKey: ['workshops', locale],
        queryFn: () => getWorkshopsFn({ data: { locale } }),
    });

export const workshopQueryOptions = (slug: string, locale: string) =>
    queryOptions({
        queryKey: ['workshop', slug, locale],
        queryFn: () => getWorkshopFn({ data: { slug, locale } }),
    });

export const workshopModuleQueryOptions = (workshopSlug: string, moduleSlug: string, locale: string) =>
    queryOptions({
        queryKey: ['workshopModule', workshopSlug, moduleSlug, locale],
        queryFn: () => getWorkshopModuleFn({ data: { workshopSlug, moduleSlug, locale } }),
    });
