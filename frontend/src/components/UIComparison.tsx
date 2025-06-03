import { Button as MantineButton, TextInput as MantineTextInput, PasswordInput as MantinePasswordInput, Select as MantineSelect } from '@mantine/core';
import { Button as ShadcnButton } from '@/components/ui/button';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppPasswordInput } from '@/components/ui/AppPasswordInput';
import { AppSelect } from '@/components/ui/AppSelect';
import { IconCheck, IconX, IconAt, IconLock, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

export function UIComparison() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  
  const selectData = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
  ];
  
  const groupedSelectData = [
    { value: 'apple', label: 'Apple', group: 'Fruits' },
    { value: 'banana', label: 'Banana', group: 'Fruits' },
    { value: 'orange', label: 'Orange', group: 'Fruits' },
    { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
    { value: 'broccoli', label: 'Broccoli', group: 'Vegetables' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-4">UI Component Migration</h1>
        <p className="text-gray-600 mb-6">
          Comparing Mantine UI components with shadcn/ui components as we migrate
        </p>
      </div>

      {/* Buttons Section */}
      <section className="space-y-4 border-b pb-8">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Primary Buttons</h3>
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
            <h3 className="text-lg font-medium mb-2">With Icons</h3>
            <div className="flex gap-4 mb-2">
              <MantineButton leftSection={<IconCheck size={16} />}>
                Mantine Success
              </MantineButton>
              <MantineButton color="red" leftSection={<IconX size={16} />}>
                Mantine Cancel
              </MantineButton>
            </div>
            <div className="flex gap-4">
              <AppButton leftSection={<IconCheck size={16} />}>
                App Success
              </AppButton>
              <AppButton color="red" leftSection={<IconX size={16} />}>
                App Cancel
              </AppButton>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Loading States</h3>
            <div className="flex gap-4 mb-2">
              <MantineButton loading>Mantine Loading</MantineButton>
              <MantineButton disabled>Mantine Disabled</MantineButton>
            </div>
            <div className="flex gap-4">
              <AppButton loading>App Loading</AppButton>
              <AppButton disabled>App Disabled</AppButton>
            </div>
          </div>
        </div>
      </section>

      {/* Inputs Section */}
      <section className="space-y-4 border-b pb-8">
        <h2 className="text-2xl font-semibold">Form Inputs</h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mantine Inputs</h3>
            
            <MantineTextInput
              label="Email"
              placeholder="your@email.com"
              leftSection={<IconAt size={16} />}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
            
            <MantinePasswordInput
              label="Password"
              placeholder="Your password"
              leftSection={<IconLock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            
            <MantineTextInput
              label="Search"
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              rightSection={<span className="text-xs text-gray-500">⌘K</span>}
            />
            
            <MantineTextInput
              label="With Error"
              placeholder="Enter text"
              error="This field is required"
              defaultValue=""
            />
            
            <MantineTextInput
              label="With Description"
              description="We'll never share your email"
              placeholder="your@email.com"
              leftSection={<IconAt size={16} />}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shadcn/App Inputs</h3>
            
            <AppTextInput
              label="Email"
              placeholder="your@email.com"
              leftSection={<IconAt size={16} />}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
            
            <AppPasswordInput
              label="Password"
              placeholder="Your password"
              leftSection={<IconLock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            
            <AppTextInput
              label="Search"
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              rightSection={<span className="text-xs text-gray-500">⌘K</span>}
            />
            
            <AppTextInput
              label="With Error"
              placeholder="Enter text"
              error="This field is required"
              defaultValue=""
            />
            
            <AppTextInput
              label="With Description"
              description="We'll never share your email"
              placeholder="your@email.com"
              leftSection={<IconAt size={16} />}
            />
          </div>
        </div>
      </section>

      {/* Select/Dropdown Section */}
      <section className="space-y-4 border-b pb-8">
        <h2 className="text-2xl font-semibold">Select/Dropdown</h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mantine Select</h3>
            
            <MantineSelect
              label="Choose a framework"
              placeholder="Pick one"
              data={selectData}
              value={selectedValue}
              onChange={setSelectedValue}
            />
            
            <MantineSelect
              label="With description"
              description="Select your favorite framework"
              placeholder="Pick one"
              data={selectData}
              searchable
              clearable
            />
            
            <MantineSelect
              label="Grouped options"
              placeholder="Pick one"
              data={groupedSelectData.map(item => ({
                value: item.value,
                label: item.label,
                group: item.group
              }))}
            />
            
            <MantineSelect
              label="With error"
              placeholder="Pick one"
              data={selectData}
              error="Please select a framework"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shadcn/App Select</h3>
            
            <AppSelect
              label="Choose a framework"
              placeholder="Pick one"
              data={selectData}
              value={selectedValue || ''}
              onChange={setSelectedValue}
            />
            
            <AppSelect
              label="With description"
              description="Select your favorite framework"
              placeholder="Pick one"
              data={selectData}
              searchable
              clearable
            />
            
            <AppSelect
              label="Grouped options"
              placeholder="Pick one"
              data={groupedSelectData}
            />
            
            <AppSelect
              label="With error"
              placeholder="Pick one"
              data={selectData}
              error="Please select a framework"
            />
          </div>
        </div>
      </section>

      {/* Form Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Example</h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mantine Form</h3>
            <div className="border rounded-lg p-6 space-y-4">
              <MantineTextInput
                label="Email"
                placeholder="your@email.com"
                leftSection={<IconAt size={16} />}
                required
              />
              <MantinePasswordInput
                label="Password"
                placeholder="Your password"
                leftSection={<IconLock size={16} />}
                required
              />
              <MantineButton fullWidth>Sign In</MantineButton>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shadcn/App Form</h3>
            <div className="border rounded-lg p-6 space-y-4">
              <AppTextInput
                label="Email"
                placeholder="your@email.com"
                leftSection={<IconAt size={16} />}
                required
              />
              <AppPasswordInput
                label="Password"
                placeholder="Your password"
                leftSection={<IconLock size={16} />}
                required
              />
              <AppButton fullWidth>Sign In</AppButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}