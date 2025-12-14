import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

interface Discount {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

const Discounts = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
    description: ''
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cupons",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      discount_percent: '',
      max_uses: '',
      expires_at: '',
      is_active: true,
      description: ''
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount);
    setFormData({
      code: discount.code,
      discount_percent: discount.discount_percent.toString(),
      max_uses: discount.max_uses?.toString() || '',
      expires_at: discount.expires_at ? discount.expires_at.split('T')[0] : '',
      is_active: discount.is_active,
      description: discount.description || ''
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDeleteDialogOpen(true);
  };

  const handleSaveCreate = async () => {
    if (!formData.code || !formData.discount_percent) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha código e percentual de desconto",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('discounts').insert({
        code: formData.code.toUpperCase(),
        discount_percent: parseInt(formData.discount_percent),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
        description: formData.description || null
      });

      if (error) throw error;

      toast({ title: "Cupom criado com sucesso" });
      setCreateDialogOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      toast({
        title: "Erro ao criar cupom",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDiscount) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('discounts')
        .update({
          code: formData.code.toUpperCase(),
          discount_percent: parseInt(formData.discount_percent),
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          expires_at: formData.expires_at || null,
          is_active: formData.is_active,
          description: formData.description || null
        })
        .eq('id', selectedDiscount.id);

      if (error) throw error;

      toast({ title: "Cupom atualizado com sucesso" });
      setEditDialogOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cupom",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDiscount) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', selectedDiscount.id);

      if (error) throw error;

      toast({ title: "Cupom excluído com sucesso" });
      setDeleteDialogOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cupom",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (discount: Discount) => {
    if (!discount.is_active) return <Badge variant="outline">{t('admin.discounts.inactive')}</Badge>;
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return <Badge variant="destructive">{t('admin.discounts.expired')}</Badge>;
    }
    return <Badge variant="default">{t('admin.discounts.active')}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.discounts.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('admin.discounts.subtitle')}</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.discounts.createCode')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.discounts.allCodes')}</CardTitle>
            <CardDescription>{discounts.length} {t('admin.discounts.manageCodes')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.discounts.code')}</TableHead>
                    <TableHead>{t('admin.discounts.value')}</TableHead>
                    <TableHead>{t('admin.discounts.uses')}</TableHead>
                    <TableHead>{t('admin.discounts.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.discounts.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum cupom cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-mono font-bold">{discount.code}</TableCell>
                        <TableCell>{discount.discount_percent}%</TableCell>
                        <TableCell>
                          {discount.current_uses} / {discount.max_uses || '∞'}
                        </TableCell>
                        <TableCell>{getStatusBadge(discount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(discount)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(discount)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.discounts.createCodeTitle')}</DialogTitle>
            <DialogDescription>{t('admin.discounts.formDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('admin.discounts.codeLabel')}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="WELCOME50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">{t('admin.discounts.valueLabel')} (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">{t('admin.discounts.maxUsesLabel')}</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder={t('admin.discounts.unlimited')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">{t('admin.discounts.expiryLabel')}</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active">{t('admin.discounts.activeLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.discounts.editCodeTitle')}</DialogTitle>
            <DialogDescription>{t('admin.discounts.formDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">{t('admin.discounts.codeLabel')}</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="WELCOME50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discount">{t('admin.discounts.valueLabel')} (%)</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxUses">{t('admin.discounts.maxUsesLabel')}</Label>
                <Input
                  id="edit-maxUses"
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder={t('admin.discounts.unlimited')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiresAt">{t('admin.discounts.expiryLabel')}</Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-active">{t('admin.discounts.activeLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cupom</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cupom <strong>{selectedDiscount?.code}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Discounts;