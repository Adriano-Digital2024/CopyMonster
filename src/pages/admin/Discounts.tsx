import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Percent } from 'lucide-react';
import { mockDiscounts } from '@/services/mockData';

const Discounts = () => {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    maxUses: '',
    expiresAt: '',
    active: true,
  });

  const handleCreate = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      maxUses: '',
      expiresAt: '',
      active: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (discount: any) => {
    setSelectedDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      maxUses: discount.maxUses?.toString() || '',
      expiresAt: discount.expiresAt || '',
      active: discount.active,
    });
    setEditDialogOpen(true);
  };

  const getStatusBadge = (discount: any) => {
    if (!discount.active) return <Badge variant="outline">{t('admin.discounts.inactive')}</Badge>;
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return <Badge variant="destructive">{t('admin.discounts.expired')}</Badge>;
    }
    return <Badge variant="default">{t('admin.discounts.active')}</Badge>;
  };

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
            <CardDescription>{t('admin.discounts.manageCodes')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.discounts.code')}</TableHead>
                    <TableHead>{t('admin.discounts.type')}</TableHead>
                    <TableHead>{t('admin.discounts.value')}</TableHead>
                    <TableHead>{t('admin.discounts.uses')}</TableHead>
                    <TableHead>{t('admin.discounts.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.discounts.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-mono font-bold">{discount.code}</TableCell>
                      <TableCell className="capitalize">{discount.type}</TableCell>
                      <TableCell>
                        {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                      </TableCell>
                      <TableCell>
                        {discount.uses} / {discount.maxUses || '∞'}
                      </TableCell>
                      <TableCell>{getStatusBadge(discount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(discount)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createDialogOpen ? t('admin.discounts.createCodeTitle') : t('admin.discounts.editCodeTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.discounts.formDescription')}
            </DialogDescription>
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
                <Label htmlFor="type">{t('admin.discounts.typeLabel')}</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('admin.discounts.percentage')}</SelectItem>
                    <SelectItem value="fixed">{t('admin.discounts.fixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">{t('admin.discounts.valueLabel')}</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">{t('admin.discounts.maxUsesLabel')}</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder={t('admin.discounts.unlimited')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">{t('admin.discounts.expiryLabel')}</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">{t('admin.discounts.activeLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
            }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
            }}>
              {createDialogOpen ? t('common.create') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Discounts;
