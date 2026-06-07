import { useEffect, useMemo, useState } from "react";
import { useCreateDemandeGateau } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    ArrowRight,
    Baby,
    Briefcase,
    CakeSlice,
    CalendarDays,
    CheckCircle,
    Clock,
    Gift,
    Heart,
    Layers,
    Loader2,
    Mail,
    MapPin,
    MessageSquare,
    Palette,
    PartyPopper,
    Phone,
    Send,
    Sparkles,
    Truck,
    Type,
    Users,
    Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const eventTypes = [
    { label: "Mariage", icon: Heart },
    { label: "Anniversaire", icon: Gift },
    { label: "Fiançailles", icon: Sparkles },
    { label: "Baptême", icon: Baby },
    { label: "Entreprise", icon: Briefcase },
    { label: "Autre", icon: PartyPopper },
];

const cakeFormats = [
    { label: "Pièce montée", icon: Layers },
    { label: "Gâteau à étages", icon: CakeSlice },
    { label: "Number cake", icon: Type },
    { label: "Letter cake", icon: Type },
    { label: "Grand gâteau rectangulaire", icon: CakeSlice },
    { label: "Cupcakes / mini pièces", icon: Sparkles },
    { label: "Buffet sucré", icon: PartyPopper },
];

const flavors = ["Chocolat", "Vanille", "Fraise", "Pistache", "Noisette", "Caramel", "Café", "Citron", "Fruits rouges", "Praliné"];
const creams = ["Chantilly", "Crème au beurre", "Ganache chocolat", "Crème pâtissière", "Mascarpone", "Mousse légère", "Fruits frais"];
const decorations = ["Simple", "Élégante", "Luxueuse", "Florale", "Thème enfant", "Thème mariage", "Photo comestible", "Couleurs personnalisées"];

const initialForm = {
    typeEvenement: "",
    formatGateau: "",
    nombrePersonnes: "",
    gouts: [] as string[],
    garnitures: [] as string[],
    decoration: [] as string[],
    couleurs: "",
    texteGateau: "",
    dateEvenement: "",
    heureSouhaitee: "",
    livraison: false,
    adresseLivraison: "",
    clientNom: "",
    clientTelephone: "",
    clientEmail: "",
    budgetClient: "",
    notesClient: "",
};
const hours24 = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutesStep = ["00", "15", "30", "45"];
export default function DemandeGateau() {
    const { toast } = useToast();
    const createMutation = useCreateDemandeGateau();
    const [step, setStep] = useState(1);
    const [sent, setSent] = useState(false);
    const [form, setForm] = useState(initialForm);

    const progress = useMemo(() => (step / 5) * 100, [step]);

    const stepTitle = [
        "Votre événement",
        "Format du gâteau",
        "Goûts et décoration",
        "Date et quantité",
        "Vos coordonnées",
    ][step - 1];

    useEffect(() => {
        if (!sent) return;

        const timer = window.setTimeout(() => {
            setSent(false);
            setStep(1);
            setForm(initialForm);
        }, 5000);

        return () => window.clearTimeout(timer);
    }, [sent]);

    const update = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const toggleArray = (key: "gouts" | "garnitures" | "decoration", value: string) => {
        setForm((prev) => {
            const exists = prev[key].includes(value);
            return {
                ...prev,
                [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
            };
        });
    };

    const next = () => setStep((prev) => Math.min(prev + 1, 5));
    const prev = () => setStep((prev) => Math.max(prev - 1, 1));
    const updateTimePart = (part: "hour" | "minute", value: string) => {
        const [currentHour = "12", currentMinute = "00"] = (form.heureSouhaitee || "12:00").split(":");

        const hour = part === "hour" ? value : currentHour;
        const minute = part === "minute" ? value : currentMinute;

        update("heureSouhaitee", `${hour}:${minute}`);
    };
    const submit = async () => {
        if (!form.clientNom || !form.clientTelephone || !form.dateEvenement) {
            toast({
                title: "Informations manquantes",
                description: "Nom, téléphone et date souhaitée sont obligatoires.",
                variant: "destructive",
            });
            return;
        }

        try {
            await createMutation.mutateAsync({
                typeEvenement: form.typeEvenement,
                formatGateau: form.formatGateau,
                nombrePersonnes: form.nombrePersonnes ? parseInt(form.nombrePersonnes) : undefined,
                gouts: form.gouts.join(", "),
                garnitures: form.garnitures.join(", "),
                decoration: form.decoration.join(", "),
                couleurs: form.couleurs,
                texteGateau: form.texteGateau,
                dateEvenement: form.dateEvenement,
                heureSouhaitee: form.heureSouhaitee || undefined,
                livraison: form.livraison,
                adresseLivraison: form.adresseLivraison,
                clientNom: form.clientNom,
                clientTelephone: form.clientTelephone,
                clientEmail: form.clientEmail,
                budgetClient: form.budgetClient ? parseFloat(form.budgetClient) : undefined,
                notesClient: form.notesClient,
            });

            setSent(true);
        } catch {
            toast({
                title: "Erreur",
                description: "Impossible d'envoyer la demande.",
                variant: "destructive",
            });
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-[#fff8f3] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="text-center border-emerald-200 shadow-2xl rounded-2xl overflow-hidden">
                        <CardContent className="p-8">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-12 w-12 text-emerald-700" />
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-primary">Demande envoyée</h1>
                            <p className="text-primary/65 mt-3">
                                Merci. Le chef va consulter votre demande et vous contacter rapidement.
                            </p>
                            <p className="text-xs text-primary/45 mt-5">
                                Retour automatique au formulaire dans quelques secondes.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fff8f3] text-primary">
            <section
                className="relative min-h-[300px] overflow-hidden bg-cover bg-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=1974&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-black/45" />
                <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 py-8 sm:px-6 min-h-[300px]">
                    <div className="max-w-3xl text-white">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                            <CakeSlice className="h-4 w-4" />
                            Boulangerie Leigois
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-serif font-bold leading-tight">
                            Demande de gâteau personnalisé
                        </h1>
                        <p className="mt-3 max-w-2xl text-white/85">
                            Mariage, anniversaire, événement, pièce montée ou création spéciale.
                        </p>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-5 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="h-2 overflow-hidden rounded-full bg-primary/10">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${item <= step ? "bg-primary" : "bg-transparent"
                                    }`}
                            />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    <Card className="border-primary/10 shadow-xl rounded-2xl overflow-hidden bg-card">
                        <CardContent className="p-0">
                            <div className="border-b border-primary/10 bg-primary/5 p-5 sm:p-6">
                                <p className="text-sm font-medium text-primary/60">Étape {step} sur 5</p>
                                <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-primary">
                                    {stepTitle}
                                </h2>
                            </div>

                            <div className="p-5 sm:p-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 18 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -18 }}
                                        transition={{ duration: 0.22 }}
                                        className="space-y-6"
                                    >
                                        {step === 1 && (
                                            <StepChoice options={eventTypes} value={form.typeEvenement} onChange={(v) => update("typeEvenement", v)} />
                                        )}

                                        {step === 2 && (
                                            <StepChoice options={cakeFormats} value={form.formatGateau} onChange={(v) => update("formatGateau", v)} />
                                        )}

                                        {step === 3 && (
                                            <>
                                                <MultiChoice title="Goûts" options={flavors} values={form.gouts} onToggle={(v) => toggleArray("gouts", v)} />
                                                <MultiChoice title="Garnitures" options={creams} values={form.garnitures} onToggle={(v) => toggleArray("garnitures", v)} />
                                                <MultiChoice title="Décoration" options={decorations} values={form.decoration} onToggle={(v) => toggleArray("decoration", v)} />

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field icon={Palette} label="Couleurs souhaitées">
                                                        <Input value={form.couleurs} onChange={(e) => update("couleurs", e.target.value)} placeholder="Blanc, doré, rose..." />
                                                    </Field>

                                                    <Field icon={MessageSquare} label="Texte sur le gâteau">
                                                        <Input value={form.texteGateau} onChange={(e) => update("texteGateau", e.target.value)} placeholder="Ex: Joyeux anniversaire Lina" />
                                                    </Field>
                                                </div>
                                            </>
                                        )}

                                        {step === 4 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field icon={Users} label="Nombre de personnes">
                                                    <Input type="number" min="1" value={form.nombrePersonnes} onChange={(e) => update("nombrePersonnes", e.target.value)} />
                                                </Field>

                                                <Field icon={Wallet} label="Budget approximatif">
                                                    <Input type="number" min="0" value={form.budgetClient} onChange={(e) => update("budgetClient", e.target.value)} placeholder="TND" />
                                                </Field>

                                                <DateField
                                                    value={form.dateEvenement}
                                                    onChange={(value: string) => update("dateEvenement", value)}
                                                />

                                                <Time24Field
                                                    value={form.heureSouhaitee}
                                                    onChangeHour={(value: string) => updateTimePart("hour", value)}
                                                    onChangeMinute={(value: string) => updateTimePart("minute", value)}
                                                />

                                                <div className="sm:col-span-2 rounded-xl border border-primary/10 bg-primary/5 p-4">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox checked={form.livraison} onCheckedChange={(v) => update("livraison", !!v)} />
                                                        <Truck className="h-4 w-4 text-primary" />
                                                        <Label>Livraison souhaitée</Label>
                                                    </div>

                                                    {form.livraison && (
                                                        <div className="mt-4 grid gap-2">
                                                            <Label className="flex items-center gap-2">
                                                                <MapPin className="h-4 w-4" />
                                                                Adresse de livraison
                                                            </Label>
                                                            <Input value={form.adresseLivraison} onChange={(e) => update("adresseLivraison", e.target.value)} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {step === 5 && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <Field icon={Users} label="Nom complet">
                                                        <Input value={form.clientNom} onChange={(e) => update("clientNom", e.target.value)} />
                                                    </Field>

                                                    <Field icon={Phone} label="Téléphone">
                                                        <Input value={form.clientTelephone} onChange={(e) => update("clientTelephone", e.target.value)} />
                                                    </Field>

                                                    <Field icon={Mail} label="Email">
                                                        <Input value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} />
                                                    </Field>
                                                </div>

                                                <Field icon={MessageSquare} label="Notes ou détails supplémentaires">
                                                    <Textarea rows={4} value={form.notesClient} onChange={(e) => update("notesClient", e.target.value)} />
                                                </Field>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between gap-3 border-t border-primary/10 pt-5">
                                    <Button variant="outline" onClick={prev} disabled={step === 1} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Retour
                                    </Button>

                                    {step < 5 ? (
                                        <Button onClick={next} className="gap-2">
                                            Suivant
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button onClick={submit} disabled={createMutation.isPending} className="gap-2">
                                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            Envoyer la demande
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <aside className="space-y-4">
                        <Card className="border-primary/10 shadow-md rounded-2xl bg-card">
                            <CardContent className="p-5">
                                <p className="text-sm text-primary/60">Résumé</p>
                                <div className="mt-4 space-y-3 text-sm">
                                    <Summary label="Événement" value={form.typeEvenement} />
                                    <Summary label="Format" value={form.formatGateau} />
                                    <Summary label="Goûts" value={form.gouts.join(", ")} />
                                    <Summary label="Date" value={form.dateEvenement} />
                                    <Summary label="Client" value={form.clientNom} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-md rounded-2xl bg-[#fff1e6]">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 text-primary">
                                    <Sparkles className="h-5 w-5" />
                                    <p className="font-semibold">Prix à confirmer</p>
                                </div>
                                <p className="mt-2 text-sm text-primary/65">
                                    Le chef reçoit votre demande, vérifie les détails, puis vous contacte avec une proposition.
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}

function Field({ icon: Icon, label, children }: any) {
    return (
        <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-primary/80">
                <Icon className="h-4 w-4 text-primary" />
                {label}
            </Label>
            {children}
        </div>
    );
}

function StepChoice({ options, value, onChange }: any) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {options.map((option: any) => {
                const Icon = option.icon;
                const active = value === option.label;

                return (
                    <motion.button
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        key={option.label}
                        type="button"
                        onClick={() => onChange(option.label)}
                        className={`rounded-2xl border p-4 text-left transition shadow-sm ${active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-primary/10 bg-card hover:bg-primary/5"
                            }`}
                    >
                        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-primary/10"}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-semibold">{option.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
}

function MultiChoice({ title, options, values, onToggle }: any) {
    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-primary">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {options.map((option: string) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onToggle(option)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${values.includes(option)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-primary/10 bg-card hover:bg-primary/5"
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

function Summary({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between gap-3 border-b border-primary/10 pb-2 last:border-b-0">
            <span className="text-primary/55">{label}</span>
            <span className="text-right font-medium text-primary">{value || "-"}</span>
        </div>
    );
}
function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-primary/80 mb-3">
                <CalendarDays className="h-4 w-4 text-primary" />
                Date souhaitée
            </Label>

            <Input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 rounded-xl border-primary/20 bg-card text-primary shadow-sm"
            />

            <p className="mt-2 text-xs text-primary/50">
                Choisissez la date prévue pour la récupération ou la livraison.
            </p>
        </div>
    );
}

function Time24Field({
    value,
    onChangeHour,
    onChangeMinute,
}: {
    value: string;
    onChangeHour: (value: string) => void;
    onChangeMinute: (value: string) => void;
}) {
    const [hour = "12", minute = "00"] = (value || "12:00").split(":");

    return (
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 shadow-sm">
            <Label className="flex items-center gap-2 text-primary/80 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                Heure souhaitée
            </Label>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Select value={hour} onValueChange={onChangeHour}>
                    <SelectTrigger className="h-12 rounded-xl border-primary/20 bg-card text-primary shadow-sm">
                        <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                        {hours24.map((h) => (
                            <SelectItem key={h} value={h}>
                                {h}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <span className="text-xl font-bold text-primary/50">:</span>

                <Select value={minute} onValueChange={onChangeMinute}>
                    <SelectTrigger className="h-12 rounded-xl border-primary/20 bg-card text-primary shadow-sm">
                        <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                        {minutesStep.map((m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-3 rounded-xl bg-card px-3 py-2 text-sm text-primary/70">
                Format 24h : <span className="font-semibold text-primary">{hour}:{minute}</span>
            </div>
        </div>
    );
}