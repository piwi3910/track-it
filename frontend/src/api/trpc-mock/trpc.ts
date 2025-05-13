/**
 * Mock tRPC core implementation
 * This file simulates the functionality of a tRPC client/server
 *
 * @ts-nocheck - Disable type checking for this file
 */

import { 
  ProcedureType, 
  MockProcedure, 
  MockProcedureEndpoint,
  MockRouter,
  ProcedureOptions 
} from './types';

// Create a procedure builder (similar to tRPC's procedure)
export function procedure<TInput = any, TOutput = any>(
  type: ProcedureType = 'query',
  outputType?: TOutput
): MockProcedure<TInput, TOutput> {
  const def: ProcedureOptions<TInput, TOutput> = {
    type,
    output: outputType as TOutput
  };

  // Create the procedure object
  const proc: MockProcedure<TInput, TOutput> = {
    _def: def,
    query: (handler) => createEndpoint('query', handler, def),
    mutation: (handler) => createEndpoint('mutation', handler, def)
  };

  return proc;
}

// Create the actual callable endpoint
function createEndpoint<TInput, TOutput>(
  type: ProcedureType,
  handler: (input: TInput) => Promise<TOutput>,
  def: ProcedureOptions<TInput, TOutput>
): MockProcedureEndpoint<TInput, TOutput> {
  const endpoint = async (input: TInput): Promise<TOutput> => {
    return handler(input);
  };

  // Attach the definition to the endpoint
  endpoint._def = {
    ...def,
    type
  };

  return endpoint;
}

// Create a router (similar to tRPC's router)
export function router<T extends Record<string, MockProcedure | MockRouter>>(
  procedures: T
): T {
  return procedures;
}

// Create a caller that can be used to call procedures (similar to tRPC's createCaller)
export function createCaller<T extends MockRouter>(router: T) {
  const caller = {} as any;

  for (const key in router) {
    const procedureOrRouter = router[key];

    if (typeof procedureOrRouter === 'function') {
      // It's a procedure endpoint
      caller[key] = procedureOrRouter;
    } else {
      // It's a nested router
      caller[key] = createCaller(procedureOrRouter as MockRouter);
    }
  }

  return caller;
}

// Query procedure
export const query = () => procedure('query');

// Mutation procedure
export const mutation = () => procedure('mutation');

// Helper to create a mock proxy (simulates tRPC's proxy client)
export function createTRPCProxyClient<T extends MockRouter>(router: T) {
  const caller = createCaller(router);
  return caller;
}