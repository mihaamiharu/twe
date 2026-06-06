import { db } from '../db';
import { workshops, workshopModules } from '../db/schema';
import { eq, and, notInArray } from 'drizzle-orm';
import { loadWorkshopRegistry, getWorkshopContent } from '../server/content.server';

export async function syncWorkshops() {
    console.log('🔄 Starting workshops sync...');

    try {
        const registry = await loadWorkshopRegistry();
        const registryWorkshops = registry.workshops || [];
        console.log(`📂 Found ${registryWorkshops.length} workshops in registry.`);

        let updatedWorkshops = 0;
        let createdWorkshops = 0;
        let updatedModules = 0;
        let createdModules = 0;

        const activeWorkshopSlugs: string[] = [];

        for (const w of registryWorkshops) {
            activeWorkshopSlugs.push(w.slug);

            let existingWorkshop = await db.query.workshops.findFirst({
                where: eq(workshops.slug, w.slug)
            });

            const workshopData = {
                slug: w.slug,
                title: w.title,
                description: w.description,
                repoUrl: w.repoUrl,
                order: w.order,
                tags: w.tags,
                isPublished: w.status === 'published' || !w.status,
                updatedAt: new Date()
            };

            if (existingWorkshop) {
                await db.update(workshops)
                    .set(workshopData)
                    .where(eq(workshops.id, existingWorkshop.id));
                updatedWorkshops++;
            } else {
                const inserted = await db.insert(workshops)
                    .values(workshopData)
                    .returning({ id: workshops.id });
                existingWorkshop = { id: inserted[0].id } as any;
                createdWorkshops++;
            }

            // Get fully populated module content (which reads markdown for titles)
            const populatedWorkshop = await getWorkshopContent(w.slug, 'en');
            if (!populatedWorkshop) continue;

            const activeModuleSlugs: string[] = [];

            for (const m of populatedWorkshop.modules) {
                activeModuleSlugs.push(m.slug);

                const existingModule = await db.query.workshopModules.findFirst({
                    where: and(
                      eq(workshopModules.workshopId, existingWorkshop!.id),
                      eq(workshopModules.slug, m.slug)
                    )
                });

                const moduleData = {
                    workshopId: existingWorkshop!.id,
                    slug: m.slug,
                    title: { en: m.title }, 
                    videoUrl: m.videoUrl ?? null,
                    branchName: m.branchName,
                    order: m.order,
                    xpReward: m.xpReward || 100,
                    updatedAt: new Date()
                };

                if (existingModule) {
                    await db.update(workshopModules)
                        .set(moduleData)
                        .where(eq(workshopModules.id, existingModule.id));
                    updatedModules++;
                } else {
                    await db.insert(workshopModules)
                        .values(moduleData);
                    createdModules++;
                }
            }
        }

        // Handle orphaned records: unpublished workshops that are no longer in registry
        if (activeWorkshopSlugs.length > 0) {
            await db.update(workshops)
                .set({ isPublished: false, updatedAt: new Date() })
                .where(notInArray(workshops.slug, activeWorkshopSlugs));
        }

        console.log(`✅ Workshops Sync Complete.`);
        console.log(`   - Workshops -> Created: ${createdWorkshops}, Updated: ${updatedWorkshops}`);
        console.log(`   - Modules   -> Created: ${createdModules}, Updated: ${updatedModules}`);

    } catch (error) {
        console.error('❌ Sync Failed:', error);
        throw error;
    }
}

if (import.meta.main) {
    syncWorkshops()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
