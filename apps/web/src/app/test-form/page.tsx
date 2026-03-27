import { Button } from '@/components/ui';

const variants = [
  'default',
  'primary-outline',
  'primary-soft',
  'neutral',
  'neutral-soft',
  'danger',
  'danger-soft',
  'danger-outline',
  'success',
  'success-soft',
  'warning',
  'warning-soft',
  'info',
  'unstyled',
  'outline',
  'secondary',
  'destructive',
  'ghost',
  'link',
] as const;

const sizes = ['xs', 'sm', 'default', 'lg'] as const;

export default function TestButtonPage() {
  return (
    <div className="space-y-10 p-8">
      <h1 className="text-2xl font-semibold">Button Variants × Sizes</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-border px-3 py-2 text-left">Variant</th>
            {sizes.map((s) => (
              <th key={s} className="border border-border px-3 py-2">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v}>
              <td className="border border-border px-3 py-2 font-mono text-xs">{v}</td>
              {sizes.map((s) => (
                <td key={s} className="border border-border px-3 py-2 text-center">
                  <Button variant={v} size={s}>
                    {v}
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold">Disabled</h2>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <Button key={v} variant={v} disabled>
            {v}
          </Button>
        ))}
      </div>

      <h2 className="text-xl font-semibold">Icon Sizes</h2>
      <div className="flex items-center gap-3">
        {(['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const).map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <Button variant="default" size={s}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
            <span className="text-xs text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold">With Icons (left & right)</h2>
      <div className="flex flex-wrap gap-2">
        {(['default', 'danger', 'success', 'neutral', 'outline'] as const).map((v) => (
          <div key={v} className="flex gap-2">
            <Button variant={v}>
              <svg
                data-icon="inline-start"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              {v}
            </Button>
            <Button variant={v}>
              {v}
              <svg
                data-icon="inline-end"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
