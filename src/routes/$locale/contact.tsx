import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, CheckCircle, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { submitContactMessage } from '@/server/contact.fn';

export const Route = createFileRoute('/$locale/contact')({
    component: ContactPage,
});

function ContactPage() {
    const { t } = useTranslation('legal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // ... (in component)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const message = formData.get('message') as string;

        try {
            const response = await submitContactMessage({
                data: { name, email, message },
            });

            if (response.success) {
                setIsSuccess(true);
                toast.success(response.message);
            } else {
                toast.error(response.error || t('contact.form.errorMessage'));
            }
        } catch {
            toast.error(t('contact.form.errorMessage'));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col justify-center max-w-5xl mx-auto px-6 py-12 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    {t('contact.title')}
                </h1>
                <p className="text-lg text-muted-foreground">
                    {t('contact.description')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Column: Contact Form */}
                <Card className="shadow-lg border-primary/10 h-full">
                    <CardHeader>
                        <CardTitle>{t('contact.form.submit')}</CardTitle>
                        <CardDescription>
                            {t('contact.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSuccess ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold">{t('contact.form.successTitle')}</h3>
                                <p className="text-muted-foreground max-w-xs">{t('contact.form.successMessage')}</p>
                                <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-4">
                                    Send Another Message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('contact.form.name')}</Label>
                                    <Input id="name" name="name" required placeholder="John Doe" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('contact.form.email')}</Label>
                                    <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        required
                                        placeholder="Tell me about what's your inquiry..."
                                        className="min-h-[150px]"
                                    />
                                </div>

                                {/* Honeypot field to fool bots (Formspree checks this) */}
                                <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t('contact.form.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            {t('contact.form.submit')}
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: 1-1 Booking & Hire Me */}
                <div className="flex flex-col gap-6 h-full">
                    {/* Booking Card */}
                    <Card className="shadow-lg border-primary/10 flex-1 flex flex-col relative overflow-hidden group hover:border-primary/30 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl">{t('contact.booking.title')}</CardTitle>
                            <CardDescription className="text-base pt-2">
                                {t('contact.booking.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {(t('contact.booking.items', { returnObjects: true }) as string[]).map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" size="lg" asChild>
                                <a
                                    href="https://calendar.app.google/CKy4ozvuwXQouzkJ6"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                >
                                    {t('contact.booking.cta')}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Hire Me Card */}
                    <Card className="shadow-lg border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10 flex flex-col relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl">{t('contact.hire.title')}</CardTitle>
                            <CardDescription className="text-base pt-2">
                                {t('contact.hire.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg" asChild>
                                <a
                                    href="https://drive.google.com/file/d/1EYmOmsqR6ZrNKG7hWP672I1CMvcPBSAi/view?usp=sharing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                >
                                    {t('contact.hire.cta')}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
