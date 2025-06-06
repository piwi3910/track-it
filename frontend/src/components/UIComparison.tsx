import { Button as MantineButton, TextInput as MantineTextInput, PasswordInput as MantinePasswordInput, Select as MantineSelect, Badge as MantineBadge, Card as MantineCard } from '@mantine/core';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppPasswordInput } from '@/components/ui/AppPasswordInput';
import { AppSelect } from '@/components/ui/AppSelect';
import { Badge } from '@/components/ui/badge';
import { AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent, AppCardFooter } from '@/components/ui/AppCard';
import { IconCheck, IconX, IconAt, IconLock, IconSearch, IconStar, IconBell } from '@tabler/icons-react';
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
              <Button>
                <IconCheck size={16} className="mr-2 h-4 w-4" />
                App Success
              </Button>
              <Button variant="destructive">
                <IconX size={16} className="mr-2 h-4 w-4" />
                App Cancel
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Loading States</h3>
            <div className="flex gap-4 mb-2">
              <MantineButton loading>Mantine Loading</MantineButton>
              <MantineButton disabled>Mantine Disabled</MantineButton>
            </div>
            <div className="flex gap-4">
              <Button disabled>App Loading</Button>
              <Button disabled>App Disabled</Button>
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

      {/* Badge Section */}
      <section className="space-y-4 border-b pb-8">
        <h2 className="text-2xl font-semibold">Badges</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Colors and Variants</h3>
            <div className="flex gap-4 mb-2 flex-wrap">
              <MantineBadge>Default</MantineBadge>
              <MantineBadge color="blue">Blue</MantineBadge>
              <MantineBadge color="red">Red</MantineBadge>
              <MantineBadge color="green">Green</MantineBadge>
              <MantineBadge color="yellow">Yellow</MantineBadge>
              <MantineBadge color="orange">Orange</MantineBadge>
              <MantineBadge color="purple">Purple</MantineBadge>
              <MantineBadge color="pink">Pink</MantineBadge>
              <MantineBadge color="gray">Gray</MantineBadge>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Badge>Default</Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Blue</Badge>
              <Badge variant="destructive">Red</Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Green</Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Yellow</Badge>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Orange</Badge>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Purple</Badge>
              <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">Pink</Badge>
              <Badge variant="secondary">Gray</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Task Priority Colors</h3>
            <div className="flex gap-4 mb-2 flex-wrap">
              <MantineBadge color="blue">Low</MantineBadge>
              <MantineBadge color="yellow">Medium</MantineBadge>
              <MantineBadge color="orange">High</MantineBadge>
              <MantineBadge color="red">Urgent</MantineBadge>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Low</Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</Badge>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</Badge>
              <Badge variant="destructive">Urgent</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Sizes</h3>
            <div className="flex gap-4 mb-2 items-center flex-wrap">
              <MantineBadge size="xs">XS Size</MantineBadge>
              <MantineBadge size="sm">SM Size</MantineBadge>
              <MantineBadge size="md">MD Size</MantineBadge>
              <MantineBadge size="lg">LG Size</MantineBadge>
              <MantineBadge size="xl">XL Size</MantineBadge>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <Badge className="text-xs h-5">XS Size</Badge>
              <Badge className="text-sm">SM Size</Badge>
              <Badge>MD Size</Badge>
              <Badge className="text-lg px-3 py-1">LG Size</Badge>
              <Badge className="text-xl px-4 py-2">XL Size</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">With Icons</h3>
            <div className="flex gap-4 mb-2 flex-wrap">
              <MantineBadge leftSection={<IconStar size={12} />}>Featured</MantineBadge>
              <MantineBadge color="red" leftSection={<IconBell size={12} />}>Alert</MantineBadge>
              <MantineBadge color="green" rightSection={<IconCheck size={12} />}>Completed</MantineBadge>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Badge><IconStar size={12} className="mr-1 inline" />Featured</Badge>
              <Badge variant="destructive"><IconBell size={12} className="mr-1 inline" />Alert</Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed<IconCheck size={12} className="ml-1 inline" /></Badge>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Variants</h3>
            <div className="flex gap-4 mb-2 flex-wrap">
              <MantineBadge variant="filled">Filled</MantineBadge>
              <MantineBadge variant="light">Light</MantineBadge>
              <MantineBadge variant="outline">Outline</MantineBadge>
              <MantineBadge variant="dot">Dot</MantineBadge>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Badge variant="default">Filled</Badge>
              <Badge variant="secondary">Light</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="outline" className="pl-6"><span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-current"></span>Dot</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Card Section */}
      <section className="space-y-4 border-b pb-8">
        <h2 className="text-2xl font-semibold">Cards</h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mantine Card</h3>
            
            <MantineCard shadow="sm" padding="lg" radius="md" withBorder>
              <MantineCard.Section>
                <div className="h-32 bg-blue-500" />
              </MantineCard.Section>
              
              <div className="mt-4">
                <h4 className="text-lg font-semibold">Card Title</h4>
                <p className="text-gray-600 mt-2">
                  This is a sample card with an image section and some content below it.
                </p>
              </div>
              
              <MantineButton variant="light" color="blue" fullWidth mt="md" radius="md">
                Book classic tour now
              </MantineButton>
            </MantineCard>
            
            <MantineCard shadow="xs" padding="sm" radius="lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full" />
                <div>
                  <h4 className="font-medium">User Profile</h4>
                  <p className="text-sm text-gray-500">user@example.com</p>
                </div>
              </div>
            </MantineCard>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shadcn/App Card</h3>
            
            <AppCard shadow="sm" padding="lg" radius="md" withBorder>
              <div className="-m-6 mb-4">
                <div className="h-32 bg-blue-500 rounded-t-lg" />
              </div>
              
              <AppCardHeader className="px-0 pt-0">
                <AppCardTitle>Card Title</AppCardTitle>
                <AppCardDescription>
                  This is a sample card with an image section and some content below it.
                </AppCardDescription>
              </AppCardHeader>
              
              <AppCardFooter className="px-0 pb-0">
                <Button variant="default" className="w-full">
                  Book classic tour now
                </Button>
              </AppCardFooter>
            </AppCard>
            
            <AppCard shadow="xs" radius="lg">
              <AppCardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full" />
                  <div>
                    <h4 className="font-medium">User Profile</h4>
                    <p className="text-sm text-gray-500">user@example.com</p>
                  </div>
                </div>
              </AppCardContent>
            </AppCard>
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
              <Button className="w-full">Sign In</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}