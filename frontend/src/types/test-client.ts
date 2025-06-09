import type { AppRouter } from '@track-it/shared/types';
import type { TRPCClient } from '@trpc/client';

export type TestClient = TRPCClient<AppRouter>;