import { Button as MantineButton } from '@mantine/core';
import { Button as ShadcnButton } from '@/components/ui/button';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

export function ButtonComparison() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Button Component Comparison</h2>
        <p className="text-gray-600 mb-6">
          Comparing Mantine UI buttons (top row) with shadcn/ui buttons (bottom row)
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Primary Buttons</h3>
          <div className="flex gap-4 mb-2">
            <MantineButton>Mantine Default</MantineButton>
            <MantineButton color="blue">Mantine Blue</MantineButton>
            <MantineButton color="green">Mantine Green</MantineButton>
            <MantineButton color="red">Mantine Red</MantineButton>
          </div>
          <div className="flex gap-4">
            <ShadcnButton>Shadcn Default</ShadcnButton>
            <ShadcnButton variant="secondary">Shadcn Secondary</ShadcnButton>
            <ShadcnButton variant="destructive">Shadcn Destructive</ShadcnButton>
            <ShadcnButton variant="ghost">Shadcn Ghost</ShadcnButton>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Outline Buttons</h3>
          <div className="flex gap-4 mb-2">
            <MantineButton variant="outline">Mantine Outline</MantineButton>
            <MantineButton variant="light">Mantine Light</MantineButton>
            <MantineButton variant="subtle">Mantine Subtle</MantineButton>
          </div>
          <div className="flex gap-4">
            <ShadcnButton variant="outline">Shadcn Outline</ShadcnButton>
            <ShadcnButton variant="link">Shadcn Link</ShadcnButton>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Sizes</h3>
          <div className="flex gap-4 items-center mb-2">
            <MantineButton size="xs">Mantine XS</MantineButton>
            <MantineButton size="sm">Mantine SM</MantineButton>
            <MantineButton size="md">Mantine MD</MantineButton>
            <MantineButton size="lg">Mantine LG</MantineButton>
            <MantineButton size="xl">Mantine XL</MantineButton>
          </div>
          <div className="flex gap-4 items-center">
            <ShadcnButton size="sm">Shadcn SM</ShadcnButton>
            <ShadcnButton size="default">Shadcn Default</ShadcnButton>
            <ShadcnButton size="lg">Shadcn LG</ShadcnButton>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">With Icons</h3>
          <div className="flex gap-4 mb-2">
            <MantineButton leftSection={<IconCheck size={16} />}>
              Mantine Success
            </MantineButton>
            <MantineButton color="red" leftSection={<IconX size={16} />}>
              Mantine Cancel
            </MantineButton>
            <MantineButton color="yellow" leftSection={<IconAlertCircle size={16} />}>
              Mantine Warning
            </MantineButton>
          </div>
          <div className="flex gap-4">
            <ShadcnButton>
              <IconCheck className="mr-2 h-4 w-4" />
              Shadcn Success
            </ShadcnButton>
            <ShadcnButton variant="destructive">
              <IconX className="mr-2 h-4 w-4" />
              Shadcn Cancel
            </ShadcnButton>
            <ShadcnButton variant="secondary">
              <IconAlertCircle className="mr-2 h-4 w-4" />
              Shadcn Warning
            </ShadcnButton>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Loading & Disabled States</h3>
          <div className="flex gap-4 mb-2">
            <MantineButton loading>Mantine Loading</MantineButton>
            <MantineButton disabled>Mantine Disabled</MantineButton>
          </div>
          <div className="flex gap-4">
            <ShadcnButton disabled>Shadcn Disabled</ShadcnButton>
          </div>
        </div>
      </div>
    </div>
  );
}