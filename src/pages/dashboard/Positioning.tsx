import { useState } from 'react';
import { Target, Save, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Diagnosis {
  id: string;
  niche: string;
  targetAudience: string;
  valueProposition: string;
  differentiators: string;
  createdAt: Date;
}

export default function Positioning() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [formData, setFormData] = useState({
    niche: '',
    targetAudience: '',
    valueProposition: '',
    differentiators: ''
  });

  const handleSave = () => {
    if (!formData.niche || !formData.targetAudience) {
      toast({
        title: t('positioning.toast.requiredFieldsTitle'),
        description: t('positioning.toast.requiredFieldsDesc'),
        variant: 'destructive'
      });
      return;
    }

    const newDiagnosis: Diagnosis = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date()
    };

    setDiagnoses([newDiagnosis, ...diagnoses]);
    setFormData({
      niche: '',
      targetAudience: '',
      valueProposition: '',
      differentiators: ''
    });

    toast({
      title: t('positioning.toast.savedTitle'),
      description: t('positioning.toast.savedDesc')
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('positioning.title')}</h1>
          <p className="text-muted-foreground">
            {t('positioning.subtitle')}
          </p>
        </div>

        {/* Form */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#6B46C120' }}
              >
                <Target 
                  className="h-6 w-6" 
                  style={{ color: '#6B46C1' }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('positioning.form.newDiagnosis')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('positioning.form.newDiagnosisDesc')}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="niche">{t('positioning.form.niche')} *</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  placeholder={t('positioning.form.nichePlaceholder')}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="target">{t('positioning.form.targetAudience')} *</Label>
                <Textarea
                  id="target"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder={t('positioning.form.targetAudiencePlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">{t('positioning.form.valueProposition')}</Label>
                <Textarea
                  id="value"
                  value={formData.valueProposition}
                  onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
                  placeholder={t('positioning.form.valuePropositionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="diff">{t('positioning.form.differentiators')}</Label>
                <Textarea
                  id="diff"
                  value={formData.differentiators}
                  onChange={(e) => setFormData({ ...formData, differentiators: e.target.value })}
                  placeholder={t('positioning.form.differentiatorsPlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {t('positioning.form.saveDiagnosis')}
            </Button>
          </div>
        </Card>

        {/* Saved Diagnoses */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('positioning.saved.title')}</h3>
          
          {diagnoses.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('positioning.saved.emptyTitle')}
              description={t('positioning.saved.emptyDesc')}
            />
          ) : (
            <div className="grid gap-4">
              {diagnoses.map((diagnosis) => (
                <Card key={diagnosis.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{diagnosis.niche}</h4>
                        <p className="text-sm text-muted-foreground">
                          {diagnosis.createdAt.toLocaleDateString(t('date.locale'))}
                        </p>
                      </div>
                      <Badge variant="secondary">{t('positioning.saved.badge')}</Badge>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('positioning.form.targetAudience')}</Label>
                        <p className="text-sm mt-1">{diagnosis.targetAudience}</p>
                      </div>

                      {diagnosis.valueProposition && (
                        <div>
                          <Label className="text-xs text-muted-foreground">{t('positioning.form.valueProposition')}</Label>
                          <p className="text-sm mt-1">{diagnosis.valueProposition}</p>
                        </div>
                      )}

                      {diagnosis.differentiators && (
                        <div>
                          <Label className="text-xs text-muted-foreground">{t('positioning.form.differentiators')}</Label>
                          <p className="text-sm mt-1">{diagnosis.differentiators}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}