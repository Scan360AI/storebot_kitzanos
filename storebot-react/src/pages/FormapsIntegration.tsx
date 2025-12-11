import { useState, useRef } from 'react';
import {
  Map,
  Camera,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Edit3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';
import type { FormapsChapter } from '../types';

const FORMAPS_URL = 'https://www.formaps.it/maps/map';

export function FormapsIntegration() {
  const {
    formapsChapters,
    addFormapsChapter,
    updateFormapsChapter,
    removeFormapsChapter,
    addToast
  } = useAppStore();

  const { generateWithImages, isGenerating } = useGemini({ temperature: 0.5 });

  const [chapters, setChapters] = useState<FormapsChapter[]>(formapsChapters);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Aggiungi nuovo capitolo
  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) {
      addToast({ message: 'Inserisci un titolo per il capitolo', type: 'warning' });
      return;
    }

    const newChapter: FormapsChapter = {
      id: Date.now().toString(),
      title: newChapterTitle.trim(),
      content: ''
    };

    setChapters((prev) => [...prev, newChapter]);
    addFormapsChapter(newChapter);
    setNewChapterTitle('');
    addToast({ message: 'Capitolo aggiunto', type: 'success' });
  };

  // Rimuovi capitolo
  const handleRemoveChapter = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo capitolo?')) {
      setChapters((prev) => prev.filter((ch) => ch.id !== id));
      removeFormapsChapter(id);
      addToast({ message: 'Capitolo eliminato', type: 'info' });
    }
  };

  // Aggiorna contenuto capitolo
  const handleUpdateContent = (id: string, content: string) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, content } : ch))
    );
    updateFormapsChapter(id, { content });
  };

  // Aggiorna titolo capitolo
  const handleUpdateTitle = (id: string, title: string) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, title } : ch))
    );
    updateFormapsChapter(id, { title });
    setEditingId(null);
  };

  // Carica screenshot
  const handleScreenshotUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    chapterId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Seleziona un file immagine', type: 'error' });
      return;
    }

    // Converti in base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setChapters((prev) =>
        prev.map((ch) => (ch.id === chapterId ? { ...ch, screenshot: base64 } : ch))
      );
      updateFormapsChapter(chapterId, { screenshot: base64 });
      addToast({ message: 'Screenshot caricato', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  // Analizza screenshot con AI
  const handleAnalyzeScreenshot = async (chapter: FormapsChapter) => {
    if (!chapter.screenshot) {
      addToast({ message: 'Carica prima uno screenshot', type: 'warning' });
      return;
    }

    // Converti base64 in File
    const response = await fetch(chapter.screenshot);
    const blob = await response.blob();
    const file = new File([blob], 'screenshot.png', { type: 'image/png' });

    const prompt = `Analizza questa mappa/screenshot di analisi territoriale Formaps.

Estrai e descrivi in italiano:
1. I dati demografici visibili
2. Le informazioni sul territorio
3. I punti di interesse evidenziati
4. Le metriche o statistiche mostrate
5. Qualsiasi altra informazione rilevante

Formatta la risposta in markdown con sezioni chiare.`;

    const result = await generateWithImages(prompt, [file]);
    if (result) {
      handleUpdateContent(chapter.id, result);
      updateFormapsChapter(chapter.id, { analysis: result, content: result });
      addToast({ message: 'Analisi completata', type: 'success' });
    }
  };

  // Esporta report
  const handleExport = () => {
    const content = chapters
      .map((ch) => `# ${ch.title}\n\n${ch.content || ch.analysis || 'Nessun contenuto'}`)
      .join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formaps_analysis.md';
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Map className="text-cyan-500" />
            Formaps Integration
          </h1>
          <p className="text-gray-500 mt-2">
            Analisi territoriale e demografica
          </p>
        </div>
        {chapters.length > 0 && (
          <Button variant="secondary" onClick={handleExport} icon={<Download size={18} />}>
            Esporta Report
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formaps iFrame */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Formaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src={FORMAPS_URL}
                className="w-full h-full border-0"
                title="Formaps"
                allow="geolocation"
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Usa Formaps per esplorare i dati territoriali. Cattura screenshot delle analisi
              e caricali nei capitoli per l'analisi AI.
            </p>
          </CardContent>
        </Card>

        {/* Add Chapter */}
        <Card>
          <CardHeader>
            <CardTitle icon={<Plus className="text-primary-500" size={20} />}>
              Nuovo Capitolo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="es. Analisi Demografica, Traffico Pedonale..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                className="flex-1"
              />
              <Button onClick={handleAddChapter} icon={<Plus size={18} />}>
                Aggiungi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chapters List */}
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <Card key={chapter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  {editingId === chapter.id ? (
                    <Input
                      value={chapter.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setChapters((prev) =>
                          prev.map((ch) =>
                            ch.id === chapter.id ? { ...ch, title: newTitle } : ch
                          )
                        );
                      }}
                      onBlur={() => handleUpdateTitle(chapter.id, chapter.title)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle(chapter.id, chapter.title)}
                      autoFocus
                      className="text-lg font-semibold"
                    />
                  ) : (
                    <CardTitle className="flex-1">
                      {chapter.title}
                      <button
                        onClick={() => setEditingId(chapter.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 size={14} />
                      </button>
                    </CardTitle>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChapter(chapter.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Screenshot */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleScreenshotUpload(e, chapter.id)}
                    className="hidden"
                    id={`screenshot-${chapter.id}`}
                  />
                  {chapter.screenshot ? (
                    <div className="relative">
                      <img
                        src={chapter.screenshot}
                        alt="Screenshot"
                        className="w-full rounded-lg border"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <label
                          htmlFor={`screenshot-${chapter.id}`}
                          className="btn btn-secondary cursor-pointer text-xs px-2 py-1"
                        >
                          Cambia
                        </label>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAnalyzeScreenshot(chapter)}
                          loading={isGenerating}
                          icon={<Sparkles size={14} />}
                        >
                          Analizza
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={`screenshot-${chapter.id}`}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Carica screenshot</span>
                    </label>
                  )}
                </div>

                {/* Content */}
                <Textarea
                  value={chapter.content || chapter.analysis || ''}
                  onChange={(e) => handleUpdateContent(chapter.id, e.target.value)}
                  placeholder="Note e analisi..."
                  rows={6}
                />
              </CardContent>
            </Card>
          ))}

          {chapters.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Aggiungi capitoli per organizzare le tue analisi Formaps
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormapsIntegration;
