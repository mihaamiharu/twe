import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Mail, FileText, Terminal, Database, Globe, Server, Code2, Milestone } from 'lucide-react';
import i18n from '@/lib/i18n';
import { Boop } from '@/components/ui/boop';

export const Route = createFileRoute('/$locale/about')({
    component: AboutPage,
    head: () => ({
        meta: [
            {
                title: `About Ekki - ${i18n.t('common:appName')}`,
            },
            {
                name: 'description',
                content: 'Meet Ekki, the QA Engineer behind TestingWithEkki. A portfolio project demonstrating full-stack engineering skills.',
            },
        ],
    }),
});

function AboutPage() {
    const { t } = useTranslation(['about', 'common']);
    const milestones = t('about:milestones.items', { returnObjects: true }) as Array<{ year: string; title: string; description: string }>;
    // Hardcoded for now as it's personal content, could move to i18n later if needed

    const expertise = [
        {
            category: t('about:expertise.automation.title'),
            icon: <Globe className="h-5 w-5 text-blue-500" />,
            skills: t('about:expertise.automation.items', { returnObjects: true }) as string[]
        },
        {
            category: t('about:expertise.backend.title'),
            icon: <Database className="h-5 w-5 text-green-500" />,
            skills: t('about:expertise.backend.items', { returnObjects: true }) as string[]
        },
        {
            category: t('about:expertise.engineering.title'),
            icon: <Terminal className="h-5 w-5 text-purple-500" />,
            skills: t('about:expertise.engineering.items', { returnObjects: true }) as string[]
        }
    ];



    return (
        <div className="min-h-screen py-20 px-6">
            <div className="max-w-4xl mx-auto space-y-16">

                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <div className="mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl mb-8">
                        {/* Using a placeholder if user image isn't available, or maybe the authenticated user's image if logged in? 
                 Better to use a generic avatar or just the initials for now if no specific image is provided. 
                 Actually, let's look for an avatar or just use initials style. 
                 Since this is "Ekki", maybe I should use a specific asset if it exists, or just a nice placeholder. 
                 I'll use a text avatar for now to be safe. */}
                        <img
                            src="/me.jpg"
                            alt="Ekki"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        <span dangerouslySetInnerHTML={{ __html: t('about:hero.title') }} />
                    </h1>

                    <h2 className="text-2xl md:text-3xl font-medium text-muted-foreground">
                        {t('about:hero.subtitle')}
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t('about:hero.description') }}
                    />

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <Button asChild size="lg" className="rounded-full">
                            <a href="https://linkedin.com/in/ekkisyam" target="_blank" rel="noopener noreferrer">
                                <Linkedin className="mr-2 h-4 w-4" />
                                {t('about:hero.connect')}
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full">
                            <a href="https://github.com/mihaamiharu" target="_blank" rel="noopener noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                {t('about:hero.github')}
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full">
                            <a href="/ekki-resume.pdf" target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                {t('about:hero.resume')}
                            </a>
                        </Button>
                    </div>
                </section>

                {/* The "Why" Section */}
                <section className="glass-card p-8 md:p-12 rounded-3xl border border-primary/10 bg-gradient-to-br from-card to-primary/5">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Code2 className="h-6 w-6 text-primary" />
                        {t('about:philosophy.title')}
                    </h3>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p dangerouslySetInnerHTML={{ __html: t('about:philosophy.intro') }} />
                        <p>
                            {t('about:philosophy.listIntro')}
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li dangerouslySetInnerHTML={{ __html: t('about:philosophy.list.auth') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('about:philosophy.list.code') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('about:philosophy.list.adaptability') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('about:philosophy.list.reliability') }} />
                        </ul>
                        <p className="mt-4">
                            {t('about:philosophy.conclusion')}
                        </p>
                    </div>
                </section>

                {/* Milestones / Journey */}
                <section>
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                            <Milestone className="h-6 w-6 text-primary" />
                            {t('about:milestones.title')}
                        </h3>
                        <p className="text-muted-foreground">{t('about:milestones.subtitle')}</p>
                    </div>

                    <div className="relative border-l border-border ml-3.5 md:ml-1/2 space-y-12 pb-4">
                        {milestones.map((milestone, index) => (
                            <div key={index} className="relative pl-8 md:pl-0">
                                {/* Dot on the line */}
                                <div className="absolute -left-[5px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />

                                <div className="flex flex-col md:flex-row gap-4 md:gap-12 group">
                                    {/* Year - distinct styling */}
                                    <div className="md:w-32 md:text-right shrink-0">
                                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {milestone.year}
                                        </span>
                                    </div>

                                    {/* Content card */}
                                    <Card className="flex-1 transition-all hover:bg-card/50 hover:border-primary/50 relative -top-4 md:-top-5">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{milestone.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {milestone.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tech Stack */}
                <section>
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold mb-2">{t('about:expertise.title')}</h3>
                        <p className="text-muted-foreground">{t('about:expertise.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {expertise.map((stack, index) => (
                            <Card key={index} className="bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-lg">
                                        <Boop rotation={15} scale={1.2} timing={200}>
                                            {stack.icon}
                                        </Boop>
                                        {stack.category}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {stack.skills.map((skill) => (
                                            <Badge key={skill} variant="secondary" className="hover:bg-primary/20">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>



                {/* Contact/Ending */}
                <section className="text-center pt-10 border-t border-border">
                    <p className="text-xl font-medium mb-6">
                        {t('about:contact.title')}
                    </p>
                    <Button asChild size="lg" className="h-12 px-8 text-lg">
                        <a href="mailto:ekki.syam@gmail.com">
                            <Mail className="mr-2 h-5 w-5" />
                            {t('about:contact.cta')}
                        </a>
                    </Button>
                </section>

            </div>
        </div >
    );
}
