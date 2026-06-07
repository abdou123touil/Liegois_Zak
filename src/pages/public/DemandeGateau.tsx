import { useMemo, useState } from "react";
import { useCreateDemandeGateau } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CakeSlice, CheckCircle, Loader2 } from "lucide-react";

const eventTypes = ["Mariage", "Anniversaire", "Fiançailles", "Baptême", "Entreprise", "Autre"];
const cakeFormats = ["Pièce montée", "Gâteau à étages", "Number cake", "Letter cake", "Grand gâteau rectangulaire", "Cupcakes / mini pièces", "Buffet sucré"];
const flavors = ["Chocolat", "Vanille", "Fraise", "Pistache", "Noisette", "Caramel", "Café", "Citron", "Fruits rouges", "Praliné"];
const creams = ["Chantilly", "Crème au beurre", "Ganache chocolat", "Crème pâtissière", "Mascarpone", "Mousse légère", "Fruits frais"];
const decorations = ["Simple", "Élégante", "Luxueuse", "Florale", "Thème enfant", "Thème mariage", "Photo comestible", "Couleurs personnalisées"];

export default function DemandeGateau() {
  const { toast } = useToast();
  const createMutation = useCreateDemandeGateau();
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);

  const [form, setForm] = useState({
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
  });

  const progress = useMemo(() => (step / 5) * 100, [step]);

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-primary/10 shadow-xl">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Demande envoyée</h1>
            <p className="text-primary/60 mt-2">
              Merci. Le chef va consulter votre demande et vous contacter rapidement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <CakeSlice className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-serif font-bold">Demande de gâteau personnalisé</h1>
              <p className="text-primary-foreground/80">Mariage, anniversaire, événement et pièces montées</p>
            </div>
          </div>
          <div className="mt-6 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary-foreground transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="border-primary/10 shadow-md">
          <CardContent className="p-6 space-y-6">
            {step === 1 && (
              <StepChoice title="Type d'événement" options={eventTypes} value={form.typeEvenement} onChange={(v) => update("typeEvenement", v)} />
            )}

            {step === 2 && (
              <StepChoice title="Format du gâteau" options={cakeFormats} value={form.formatGateau} onChange={(v) => update("formatGateau", v)} />
            )}

            {step === 3 && (
              <div className="space-y-6">
                <MultiChoice title="Goûts" options={flavors} values={form.gouts} onToggle={(v) => toggleArray("gouts", v)} />
                <MultiChoice title="Garnitures" options={creams} values={form.garnitures} onToggle={(v) => toggleArray("garnitures", v)} />
                <MultiChoice title="Décoration" options={decorations} values={form.decoration} onToggle={(v) => toggleArray("decoration", v)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Couleurs souhaitées</Label>
                    <Input value={form.couleurs} onChange={(e) => update("couleurs", e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Texte sur le gâteau</Label>
                    <Input value={form.texteGateau} onChange={(e) => update("texteGateau", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nombre de personnes</Label>
                  <Input type="number" value={form.nombrePersonnes} onChange={(e) => update("nombrePersonnes", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Budget approximatif</Label>
                  <Input type="number" value={form.budgetClient} onChange={(e) => update("budgetClient", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Date souhaitée</Label>
                  <Input type="date" value={form.dateEvenement} onChange={(e) => update("dateEvenement", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Heure souhaitée</Label>
                  <Input type="time" value={form.heureSouhaitee} onChange={(e) => update("heureSouhaitee", e.target.value)} />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <Checkbox checked={form.livraison} onCheckedChange={(v) => update("livraison", !!v)} />
                  <Label>Livraison souhaitée</Label>
                </div>
                {form.livraison && (
                  <div className="sm:col-span-2 grid gap-2">
                    <Label>Adresse de livraison</Label>
                    <Input value={form.adresseLivraison} onChange={(e) => update("adresseLivraison", e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Nom complet</Label>
                    <Input value={form.clientNom} onChange={(e) => update("clientNom", e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Téléphone</Label>
                    <Input value={form.clientTelephone} onChange={(e) => update("clientTelephone", e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes ou détails supplémentaires</Label>
                  <Textarea rows={4} value={form.notesClient} onChange={(e) => update("notesClient", e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-primary/10">
              <Button variant="outline" onClick={prev} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              {step < 5 ? (
                <Button onClick={next}>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Envoyer la demande
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StepChoice({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl border p-4 text-left transition ${
              value === option ? "border-primary bg-primary/10 text-primary" : "border-primary/10 hover:bg-primary/5"
            }`}
          >
            <span className="font-medium">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChoice({ title, options, values, onToggle }: { title: string; options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              values.includes(option) ? "border-primary bg-primary text-primary-foreground" : "border-primary/10 hover:bg-primary/5"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}