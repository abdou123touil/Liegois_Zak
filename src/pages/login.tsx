import { useState } from "react";
import { useLogin } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Croissant } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: t('login.error'), description: t('login.please_enter'), variant: "destructive" });
      return;
    }

    try {
      const user = await loginMutation.mutateAsync({ data: { username, password } });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: t('login.success'), description: t('login.success'), variant: "default" });
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/pos");
      }
    } catch (err) {
      toast({ title: t('login.error'), description: t('login.invalid_credentials'), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Image de fond pains */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop')" }}
      />
      {/* Superposition turquoise avec opacité */}
      <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-card border border-border shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-6 pt-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md bg-primary"
            >
              <Croissant className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-serif text-primary">
              {t('app.name')}
            </CardTitle>
            <CardDescription className="text-foreground/80 font-medium uppercase tracking-widest text-xs pt-2">
              {t('app.pos')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-primary">{t('login.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.username_placeholder')}
                  className="h-12 text-lg focus-visible:ring-primary bg-black/80 dark:bg-black/60 border-border rounded-xl text-white placeholder:text-white/50"
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.password_placeholder')}
                  className="h-12 text-lg focus-visible:ring-primary bg-black/80 dark:bg-black/60 border-border rounded-xl text-white placeholder:text-white/50"
                  disabled={loginMutation.isPending}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-lg font-medium shadow-lg transition-all hover:shadow-xl rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t('login.sign_in')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}