import type { ComponentType, ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type FeatureHeroStat = {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
};

type FeatureHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  stats?: FeatureHeroStat[];
};

const displayFont = "'Lora', Georgia, serif";

export function FeatureHero({ eyebrow, title, description, icon: Icon = Activity, actions, stats = [] }: FeatureHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#2d261c] bg-[#18140f] p-6 text-white shadow-[0_24px_80px_-36px_rgba(24,20,15,0.8)] sm:p-8">
      <div className="absolute inset-0 opacity-75">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8622e]/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#f1c27d]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative grid gap-6 xl:grid-cols-[1.35fr_0.9fr] xl:items-end">
        <div>
          <Badge className="mb-5 border-white/15 bg-white/10 text-white hover:bg-white/10">{eyebrow}</Badge>
          <div className="flex items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#c8622e] shadow-[0_18px_40px_-18px_rgba(200,98,46,0.95)] sm:flex">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl" style={{ fontFamily: displayFont }}>
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d9cdbf] sm:text-base">{description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {stats.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {stats.slice(0, 3).map(stat => {
                const StatIcon = stat.icon ?? Activity;
                return (
                  <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[#bcae9f]">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#f1c27d]">
                        <StatIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {actions && (
            <div className="flex flex-wrap gap-2 [&_button]:border-white/20 [&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/15">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
