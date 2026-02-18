'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  whatsappEnabled: boolean
  hasTwilioConfig: boolean
  twilioAccountSid: string | null
  twilioPhoneNumber: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Twilio form (each teacher configures their own)
  const [twilioAccountSid, setTwilioAccountSid] = useState('')
  const [twilioAuthToken, setTwilioAuthToken] = useState('')
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      setProfile(data.user)
      setName(data.user.name || '')
      setPhone(data.user.phone || '')
      setWhatsappEnabled(data.user.whatsappEnabled || false)
      
      // Fetch full user details including Twilio config
      const userResponse = await fetch(`/api/users/${data.user.id}`)
      const userData = await userResponse.json()
      setTwilioAccountSid(userData.user?.twilioAccountSid || '')
      setTwilioPhoneNumber(userData.user?.twilioPhoneNumber || '')
      // Token is never returned for security
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const updateData: Record<string, unknown> = {
        name,
        phone
      }

      if (newPassword) {
        updateData.password = newPassword
      }

      const response = await fetch(`/api/users/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar perfil' })
        return
      }

      setProfile(data.user)
      setNewPassword('')
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar perfil' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTwilio = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const updateData: Record<string, unknown> = {
        whatsappEnabled,
        twilioAccountSid: twilioAccountSid || null,
        twilioAuthToken: twilioAuthToken || null,
        twilioPhoneNumber: twilioPhoneNumber || null
      }

      // Only send token if it was changed (not empty)
      if (!twilioAuthToken && profile?.hasTwilioConfig) {
        // Keep existing token if user didn't enter a new one
        delete updateData.twilioAuthToken
      }

      const response = await fetch(`/api/users/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar configurações' })
        return
      }

      setProfile(data.user)
      setMessage({ type: 'success', text: 'Configurações do WhatsApp salvas!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestWhatsApp = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao testar WhatsApp' })
        return
      }

      setMessage({ type: 'success', text: 'Mensagem de teste enviada com sucesso! Verifique seu WhatsApp.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar WhatsApp' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500">Gerencie seu perfil e integrações</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize suas informações de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Deixe em branco para manter a atual"
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Integração WhatsApp
                      {profile?.hasTwilioConfig && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Configurado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Configure suas credenciais do Twilio para envio de mensagens WhatsApp.
                      Cada professor deve configurar suas PRÓPRIAS credenciais.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={whatsappEnabled}
                      onCheckedChange={setWhatsappEnabled}
                    />
                    <Label>Ativar</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Como configurar o Twilio:</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                    <li>Crie uma conta no <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">Twilio</a></li>
                    <li>No console do Twilio, copie o Account SID e Auth Token</li>
                    <li>Ative o WhatsApp Sandbox ou compre um número WhatsApp Business</li>
                    <li>Cole as credenciais abaixo</li>
                    <li>Teste a conexão</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
                  <Input
                    id="twilioAccountSid"
                    value={twilioAccountSid}
                    onChange={(e) => setTwilioAccountSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioAuthToken">Auth Token</Label>
                  <Input
                    id="twilioAuthToken"
                    type="password"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    placeholder={profile?.hasTwilioConfig ? "••••••••••••••••" : "Seu Auth Token"}
                  />
                  {profile?.hasTwilioConfig && (
                    <p className="text-xs text-gray-500">
                      Deixe em branco para manter o token atual
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioPhoneNumber">Número WhatsApp</Label>
                  <Input
                    id="twilioPhoneNumber"
                    value={twilioPhoneNumber}
                    onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                    placeholder="+14155238886"
                  />
                  <p className="text-xs text-gray-500">
                    Número do Twilio no formato internacional (ex: +14155238886)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTwilio} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestWhatsApp}
                    disabled={testing || !profile?.hasTwilioConfig}
                  >
                    {testing ? 'Enviando...' : 'Testar Conexão'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lembretes Automáticos</CardTitle>
                <CardDescription>
                  Configure quando os lembretes de pagamento devem ser enviados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Os lembretes automáticos são enviados 3 dias antes do vencimento para pagamentos pendentes.
                    Certifique-se de que seu WhatsApp está ativo e configurado corretamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
