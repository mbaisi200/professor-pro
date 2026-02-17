'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Settings,
  Send,
  Check,
  X,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  TestTube,
  HelpCircle,
  Clock,
  Bell,
  Play,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TwilioConfig {
  id?: string;
  teacherId: string;
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  reminderDays: number;
  reminderMessage: string;
  enabled: boolean;
  autoSendEnabled: boolean;
  autoSendTime: string;
  autoSendBeforeDue: number;
  timezone: string;
}

const DEFAULT_MESSAGE = `Olá! Este é um lembrete de pagamento da mensalidade.

Aluno: {aluno}
Valor: R$ {valor}
Vencimento: Dia {vencimento}

Por favor, entre em contato para regularizar.`;

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Bahia', label: 'Bahia (GMT-3)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
];

export default function WhatsAppSettingsPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [config, setConfig] = useState<TwilioConfig | null>(null);
  
  // Form state
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [reminderMessage, setReminderMessage] = useState(DEFAULT_MESSAGE);
  const [enabled, setEnabled] = useState(true);
  
  // Auto send state
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [autoSendTime, setAutoSendTime] = useState('09:00');
  const [autoSendBeforeDue, setAutoSendBeforeDue] = useState(0);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  
  // Test message
  const [testPhone, setTestPhone] = useState('');

  const teacherId = useMemo(() => userData?.id || null, [userData]);

  // Load config on mount
  useEffect(() => {
    if (teacherId) {
      loadConfig();
    }
  }, [teacherId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/twilio-config?teacherId=${teacherId}`);
      const data = await response.json();
      
      if (data && data.teacherId) {
        setConfig(data);
        setAccountSid(data.accountSid || '');
        setAuthToken(''); // Não carregar o token por segurança
        setPhoneNumber(data.phoneNumber || '');
        setReminderDays(data.reminderDays || 3);
        setReminderMessage(data.reminderMessage || DEFAULT_MESSAGE);
        setEnabled(data.enabled ?? true);
        setAutoSendEnabled(data.autoSendEnabled ?? false);
        setAutoSendTime(data.autoSendTime || '09:00');
        setAutoSendBeforeDue(data.autoSendBeforeDue ?? 0);
        setTimezone(data.timezone || 'America/Sao_Paulo');
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accountSid || !phoneNumber) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Se não tem config salvo, authToken é obrigatório
    if (!config && !authToken) {
      toast.error('Auth Token é obrigatório para nova configuração');
      return;
    }

    try {
      setSaving(true);
      
      const body: any = {
        teacherId,
        accountSid,
        phoneNumber,
        reminderDays,
        reminderMessage,
        enabled,
        autoSendEnabled,
        autoSendTime,
        autoSendBeforeDue,
        timezone,
      };
      
      // Só enviar authToken se foi preenchido (novo ou atualização)
      if (authToken) {
        body.authToken = authToken;
      } else if (config) {
        body.authToken = config.authToken || '';
      }

      const response = await fetch('/api/twilio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configuração salva com sucesso!');
        loadConfig();
      } else {
        toast.error(data.error || 'Erro ao salvar configuração');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) {
      toast.error('Informe um número para teste');
      return;
    }

    try {
      setTesting(true);
      
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          phone: testPhone,
          studentName: 'Aluno Teste',
          amount: 150.00,
          dueDate: 10,
          customMessage: '🧪 Esta é uma mensagem de teste do ProClass!',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Mensagem de teste enviada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem de teste');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setTesting(false);
    }
  };

  const handleRunCron = async () => {
    if (!confirm('Executar verificação de lembretes agora? Isso enviará mensagens para os alunos elegíveis.')) {
      return;
    }

    try {
      setRunningCron(true);
      
      const response = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Processado! Enviados: ${data.sent}, Falhas: ${data.failed}, Ignorados: ${data.skipped}`);
      } else {
        toast.error(data.error || data.message || 'Erro ao executar verificação');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao executar verificação');
    } finally {
      setRunningCron(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir a configuração do WhatsApp?')) {
      return;
    }

    try {
      const response = await fetch(`/api/twilio-config?teacherId=${teacherId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configuração excluída com sucesso!');
        setConfig(null);
        setAccountSid('');
        setAuthToken('');
        setPhoneNumber('');
        setReminderDays(3);
        setReminderMessage(DEFAULT_MESSAGE);
        setEnabled(true);
        setAutoSendEnabled(false);
        setAutoSendTime('09:00');
        setAutoSendBeforeDue(0);
      } else {
        toast.error(data.error || 'Erro ao excluir configuração');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir configuração');
    }
  };

  if (!user || !userData) {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Configurações WhatsApp
                </h1>
                <p className="text-slate-500">
                  Configure a integração com Twilio para enviar lembretes automáticos
                </p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Card */}
              <Alert className="bg-blue-50 border-blue-200">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Como configurar</AlertTitle>
                <AlertDescription className="text-blue-700 mt-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Crie uma conta no <a href="https://www.twilio.com" target="_blank" className="underline font-medium">Twilio</a></li>
                    <li>Ative o WhatsApp no console do Twilio</li>
                    <li>Copie o Account SID, Auth Token e número WhatsApp</li>
                    <li>Cole nas configurações abaixo</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Credentials Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Credenciais Twilio
                  </CardTitle>
                  <CardDescription>
                    Configure suas credenciais do Twilio para enviar mensagens WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountSid">Account SID *</Label>
                      <Input
                        id="accountSid"
                        placeholder="AC..."
                        value={accountSid}
                        onChange={(e) => setAccountSid(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authToken">Auth Token {!config && '*'}</Label>
                      <Input
                        id="authToken"
                        type="password"
                        placeholder={config ? '•••••••• (deixe vazio para manter)' : 'Seu Auth Token'}
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Número WhatsApp (Twilio) *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="whatsapp:+14155238886"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Formato: whatsapp:+[código país][número]. Ex: whatsapp:+14155238886
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enabled}
                        onCheckedChange={setEnabled}
                      />
                      <Label>Integração ativa</Label>
                    </div>
                    <div className="flex gap-2">
                      {config && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      )}
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Auto Send Card */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    Envio Automático
                  </CardTitle>
                  <CardDescription>
                    Configure o envio automático de lembretes baseado na data de vencimento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-green-200">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={autoSendEnabled}
                        onCheckedChange={setAutoSendEnabled}
                      />
                      <div>
                        <Label className="font-medium">Habilitar envio automático</Label>
                        <p className="text-xs text-slate-500">
                          Envia lembretes automaticamente no dia configurado
                        </p>
                      </div>
                    </div>
                  </div>

                  {autoSendEnabled && (
                    <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg bg-white border border-green-200">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Dias antes do vencimento
                        </Label>
                        <Select 
                          value={autoSendBeforeDue.toString()} 
                          onValueChange={(v) => setAutoSendBeforeDue(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No dia do vencimento</SelectItem>
                            <SelectItem value="1">1 dia antes</SelectItem>
                            <SelectItem value="2">2 dias antes</SelectItem>
                            <SelectItem value="3">3 dias antes</SelectItem>
                            <SelectItem value="5">5 dias antes</SelectItem>
                            <SelectItem value="7">1 semana antes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Horário de envio</Label>
                        <Input
                          type="time"
                          value={autoSendTime}
                          onChange={(e) => setAutoSendTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fuso horário</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleRunCron}
                      disabled={runningCron || !config}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      {runningCron ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      Executar Agora
                    </Button>
                    <p className="text-xs text-slate-500">
                      O envio automático roda diariamente às 09:00 (horário de Brasília)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Message Template Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Modelo de Mensagem</CardTitle>
                  <CardDescription>
                    Personalize a mensagem de lembrete de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reminderMessage">Mensagem de Lembrete</Label>
                    <Textarea
                      id="reminderMessage"
                      rows={6}
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Variáveis disponíveis: {'{aluno}'}, {'{valor}'}, {'{vencimento}'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Test Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Testar Envio
                  </CardTitle>
                  <CardDescription>
                    Envie uma mensagem de teste para verificar a configuração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Número para teste (ex: 11999999999)"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleTest}
                      disabled={testing || !config}
                    >
                      {testing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      Enviar Teste
                    </Button>
                  </div>
                  {!config && (
                    <p className="text-sm text-amber-600">
                      Salve as configurações antes de testar
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Informações de Custo</AlertTitle>
                <AlertDescription>
                  O Twilio cobra por mensagem enviada via WhatsApp. 
                  Consulte os preços atuais no site do Twilio. 
                  Aproximadamente US$ 0,005 por mensagem.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
