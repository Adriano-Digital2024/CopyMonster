import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Brain, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useModels, AIModel } from '@/hooks/useModels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Models = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { models, addModel, updateModel, deleteModel, toggleModel } = useModels();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  
  const [newModel, setNewModel] = useState({
    modelId: '',
    name: '',
    description: '',
    maxTokens: '',
    contextWindow: '',
  });

  const handleAddModel = () => {
    if (!newModel.modelId || !newModel.name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Model ID e Nome são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    addModel({
      modelId: newModel.modelId,
      name: newModel.name,
      description: newModel.description,
      provider: 'Custom',
      active: true,
      maxTokens: newModel.maxTokens || '4096',
      contextWindow: newModel.contextWindow || '8192',
      costPer1k: '0.000',
      status: 'available',
    });

    setIsAddDialogOpen(false);
    setNewModel({
      modelId: '',
      name: '',
      description: '',
      maxTokens: '',
      contextWindow: '',
    });

    toast({
      title: t('admin.models.saved'),
      description: t('admin.models.savedDesc'),
    });
  };

  const handleEditModel = () => {
    if (!editingModel) return;

    updateModel(editingModel.id, editingModel);
    setIsEditDialogOpen(false);
    setEditingModel(null);

    toast({
      title: t('admin.models.saved'),
      description: t('admin.models.savedDesc'),
    });
  };

  const handleDeleteModel = (id: string) => {
    deleteModel(id);
    setDeleteModelId(null);
    
    toast({
      title: t('admin.models.saved'),
      description: 'Modelo removido com sucesso',
    });
  };

  const openEditDialog = (model: AIModel) => {
    setEditingModel({ ...model });
    setIsEditDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.models.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('admin.models.subtitle')}</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.models.addModel')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t('admin.models.addModel')}</DialogTitle>
                <DialogDescription>
                  {t('admin.models.addModelDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="modelId">
                    {t('admin.models.modelId')}*
                  </Label>
                  <Input
                    id="modelId"
                    value={newModel.modelId}
                    onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                    placeholder={t('admin.models.modelIdPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    This must match the model expected by the API
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('admin.models.modelName')}*
                  </Label>
                  <Input
                    id="name"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder={t('admin.models.modelNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('admin.models.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={newModel.description}
                    onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                    placeholder={t('admin.models.descriptionPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">
                      {t('admin.models.maxTokens')}
                    </Label>
                    <Input
                      id="maxTokens"
                      value={newModel.maxTokens}
                      onChange={(e) => setNewModel({ ...newModel, maxTokens: e.target.value })}
                      placeholder={t('admin.models.maxTokensPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contextWindow">
                      {t('admin.models.contextWindow')}
                    </Label>
                    <Input
                      id="contextWindow"
                      value={newModel.contextWindow}
                      onChange={(e) => setNewModel({ ...newModel, contextWindow: e.target.value })}
                      placeholder={t('admin.models.contextWindowPlaceholder')}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('admin.models.cancel')}
                </Button>
                <Button onClick={handleAddModel}>
                  {t('admin.models.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {models.map((model) => (
            <Card key={model.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{model.name}</CardTitle>
                      <CardDescription className="mt-1">{model.modelId}</CardDescription>
                      <CardDescription className="mt-1">{model.provider}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={model.status === 'operational' ? 'default' : 'outline'}>
                      {model.status === 'operational' ? t('admin.models.operational') : t('admin.models.available')}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`model-${model.id}`} 
                        checked={model.active} 
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <Label htmlFor={`model-${model.id}`}>{t('admin.models.active')}</Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {model.description && (
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                )}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t('admin.models.maxTokens')}
                    </Label>
                    <p className="font-medium">{model.maxTokens}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t('admin.models.contextWindow')}
                    </Label>
                    <p className="font-medium">{model.contextWindow}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t('admin.models.costPer1k')}
                    </Label>
                    <p className="font-medium">${model.costPer1k}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(model)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('admin.models.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteModelId(model.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('admin.models.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('admin.models.edit')}</DialogTitle>
              <DialogDescription>
                Edite as configurações do modelo
              </DialogDescription>
            </DialogHeader>
            {editingModel && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-modelId">
                    {t('admin.models.modelId')}*
                  </Label>
                  <Input
                    id="edit-modelId"
                    value={editingModel.modelId}
                    onChange={(e) => setEditingModel({ ...editingModel, modelId: e.target.value })}
                    placeholder={t('admin.models.modelIdPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    {t('admin.models.modelName')}*
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingModel.name}
                    onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                    placeholder={t('admin.models.modelNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    {t('admin.models.description')}
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingModel.description}
                    onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                    placeholder={t('admin.models.descriptionPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxTokens">
                      {t('admin.models.maxTokens')}
                    </Label>
                    <Input
                      id="edit-maxTokens"
                      value={editingModel.maxTokens}
                      onChange={(e) => setEditingModel({ ...editingModel, maxTokens: e.target.value })}
                      placeholder={t('admin.models.maxTokensPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contextWindow">
                      {t('admin.models.contextWindow')}
                    </Label>
                    <Input
                      id="edit-contextWindow"
                      value={editingModel.contextWindow}
                      onChange={(e) => setEditingModel({ ...editingModel, contextWindow: e.target.value })}
                      placeholder={t('admin.models.contextWindowPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('admin.models.cancel')}
              </Button>
              <Button onClick={handleEditModel}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteModelId} onOpenChange={() => setDeleteModelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.models.deleteModel')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.models.deleteModelDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('admin.models.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteModelId && handleDeleteModel(deleteModelId)}>
                {t('admin.models.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Models;
