import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Mail, FileText, Terminal, Database, Globe, Server, Code2 } from 'lucide-react';
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

    const gear = [
        {
            category: t('about:gear.hardware'),
            items: [
                { name: t('about:gear.items.macbook.name'), description: t('about:gear.items.macbook.desc') },
                { name: t('about:gear.items.keyboard.name'), description: t('about:gear.items.keyboard.desc') },
                { name: t('about:gear.items.monitor.name'), description: t('about:gear.items.monitor.desc') }
            ]
        },
        {
            category: t('about:gear.software'),
            items: [
                { name: t('about:gear.items.vscode.name'), description: t('about:gear.items.vscode.desc') },
                { name: t('about:gear.items.arc.name'), description: t('about:gear.items.arc.desc') },
                { name: t('about:gear.items.ghostty.name'), description: t('about:gear.items.ghostty.desc') }
            ]
        },
        {
            category: t('about:gear.productivity'),
            items: [
                { name: t('about:gear.items.notion.name'), description: t('about:gear.items.notion.desc') },
                { name: t('about:gear.items.linear.name'), description: t('about:gear.items.linear.desc') },
                { name: t('about:gear.items.raycast.name'), description: t('about:gear.items.raycast.desc') }
            ]
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
                            <li dangerouslySetInnerHTML={{ __html: t('about:philosophy.list.gamification') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('about:philosophy.list.i18n') }} />
                        </ul>
                        <p className="mt-4">
                            {t('about:philosophy.conclusion')}
                        </p>
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

                {/* Gear & Tools (Uses) */}
                <section className="glass-card p-8 md:p-12 rounded-3xl border border-primary/10">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold mb-2">{t('about:gear.title')}</h3>
                        <p className="text-muted-foreground">{t('about:gear.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {gear.map((category) => (
                            <div key={category.category} className="space-y-4">
                                <h4 className="text-lg font-semibold border-b border-border pb-2 text-primary">{category.category}</h4>
                                <ul className="space-y-3">
                                    {category.items.map((item) => (
                                        <li key={item.name} className="flex flex-col">
                                            <span className="font-medium text-foreground">{item.name}</span>
                                            <span className="text-sm text-muted-foreground">{item.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
        </div>
    );
}
