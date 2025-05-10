"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Plus, Trash2, Download, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Cable {
  id: string
  tag: string
  location: string
  description: string
}

export default function CableFinder() {
  const [cables, setCables] = useState<Cable[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newCable, setNewCable] = useState<Omit<Cable, "id">>({
    tag: "",
    location: "",
    description: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Registrar o service worker para PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("Service Worker registrado com sucesso:", registration.scope)
          },
          (err) => {
            console.log("Falha ao registrar Service Worker:", err)
          },
        )
      })
    }

    // Capturar o evento de instalação
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    })

    // Verificar se o app já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }
  }, [])

  // Carregar dados do localStorage quando o componente montar
  useEffect(() => {
    const savedCables = localStorage.getItem("cables")
    if (savedCables) {
      setCables(JSON.parse(savedCables))
    }
  }, [])

  // Salvar dados no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem("cables", JSON.stringify(cables))
  }, [cables])

  const filteredCables = cables.filter(
    (cable) =>
      cable.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cable.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cable.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCable = () => {
    if (newCable.tag.trim() === "") return

    const cable: Cable = {
      id: Date.now().toString(),
      ...newCable,
    }

    setCables([...cables, cable])
    setNewCable({ tag: "", location: "", description: "" })
    setIsDialogOpen(false)
    toast({
      title: "Cabo adicionado",
      description: `O cabo ${cable.tag} foi adicionado com sucesso.`,
    })
  }

  const handleDeleteCable = (id: string) => {
    const cableToDelete = cables.find((cable) => cable.id === id)
    setCables(cables.filter((cable) => cable.id !== id))
    toast({
      title: "Cabo removido",
      description: `O cabo ${cableToDelete?.tag} foi removido.`,
      variant: "destructive",
    })
  }

  const handleInstallApp = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === "accepted") {
      setInstallPrompt(null)
      setIsInstalled(true)
      toast({
        title: "Aplicativo instalado",
        description: "O aplicativo foi instalado com sucesso!",
      })
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(cables)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `cabos_export_${new Date().toLocaleDateString()}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Dados exportados",
      description: "Os dados foram exportados com sucesso.",
    })
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8")
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const importedData = JSON.parse(e.target.result as string) as Cable[]
            setCables(importedData)
            toast({
              title: "Dados importados",
              description: `${importedData.length} cabos foram importados com sucesso.`,
            })
          } catch (error) {
            toast({
              title: "Erro na importação",
              description: "O arquivo selecionado não é válido.",
              variant: "destructive",
            })
          }
        }
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-8">Localizador de Cabos</h1>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por TAG, localização ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cabo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tag">TAG</Label>
                <Input
                  id="tag"
                  placeholder="Ex: TT778-1"
                  value={newCable.tag}
                  onChange={(e) => setNewCable({ ...newCable, tag: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  placeholder="Ex: Painel 3, Setor B"
                  value={newCable.location}
                  onChange={(e) => setNewCable({ ...newCable, location: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes adicionais sobre o cabo..."
                  value={newCable.description}
                  onChange={(e) => setNewCable({ ...newCable, description: e.target.value })}
                />
              </div>
              <Button onClick={handleAddCable}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-between mb-4">
        {!isInstalled && installPrompt && (
          <Button variant="outline" onClick={handleInstallApp}>
            Instalar Aplicativo
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <div className="relative">
            <input
              type="file"
              id="importFile"
              accept=".json"
              onChange={importData}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          </div>
        </div>
      </div>

      {filteredCables.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {searchTerm
            ? "Nenhum cabo encontrado com esses termos."
            : "Nenhum cabo cadastrado. Adicione seu primeiro cabo!"}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCables.map((cable) => (
            <Card key={cable.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{cable.tag}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCable(cable.id)}
                    aria-label="Excluir cabo"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1">
                  <div className="text-sm font-medium">Localização:</div>
                  <div className="text-sm text-muted-foreground mb-2">{cable.location}</div>
                  {cable.description && (
                    <>
                      <div className="text-sm font-medium">Descrição:</div>
                      <div className="text-sm text-muted-foreground">{cable.description}</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Aplicativo offline - Todos os dados são armazenados localmente no seu dispositivo</p>
      </div>

      <Toaster />
    </div>
  )
}
