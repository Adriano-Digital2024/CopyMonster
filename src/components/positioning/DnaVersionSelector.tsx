import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import type { DnaVersion } from '@/hooks/useDnaVersions';

interface DnaVersionSelectorProps {
  versions: DnaVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DnaVersionSelector({
  versions,
  selectedVersionId,
  onSelectVersion,
  open,
  onOpenChange,
}: DnaVersionSelectorProps) {
  const { t, i18n } = useTranslation();

  const getVersionTypeLabel = (type: string) => {
    switch (type) {
      case 'original': return t('dna.versions.original');
      case 'market_update': return t('dna.versions.marketUpdate');
      case 'experimental': return t('dna.versions.experimental');
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('dna.versions.selectVersion')}
          </DialogTitle>
          <DialogDescription>{t('dna.versions.selectVersionDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Label>{t('dna.versions.versionLabel')}</Label>
          <Select
            value={selectedVersionId || 'base'}
            onValueChange={(val) => onSelectVersion(val === 'base' ? null : val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">
                v1.0 — {t('dna.versions.original')} ({t('dna.versions.current')})
              </SelectItem>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  v{v.version_label} — {getVersionTypeLabel(v.version_type)}{' '}
                  {v.is_active && `(${t('dna.versions.active')})`}{' '}
                  — {new Date(v.created_at).toLocaleDateString(i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t('dna.selector.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DnaVersionBadgeProps {
  versions: DnaVersion[];
  selectedVersionId: string | null;
  onClick: () => void;
}

export function DnaVersionBadge({ versions, selectedVersionId, onClick }: DnaVersionBadgeProps) {
  const { t } = useTranslation();

  if (versions.length === 0) return null;

  const selectedVersion = selectedVersionId
    ? versions.find(v => v.id === selectedVersionId)
    : null;

  const label = selectedVersion
    ? t('dna.versions.usingVersion', { version: selectedVersion.version_label })
    : t('dna.versions.current');

  return (
    <Badge
      variant="outline"
      className="gap-1.5 cursor-pointer hover:bg-accent"
      onClick={onClick}
    >
      <GitBranch className="h-3 w-3" />
      {label}
    </Badge>
  );
}
