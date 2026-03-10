import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@nhcs/api';

export const trpc = createTRPCReact<AppRouter>();
