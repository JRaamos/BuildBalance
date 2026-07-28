import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { signOut } from '../auth/authSlice';

export interface Pagination<T> { data: T[]; pagination: { page: number; limit: number; total: number; pages: number } }
export interface FinancialSummary {
  totalBudget: string;
  totalExpenses: string;
  remainingBudget: string;
  usagePercentage: number;
  plannedScopeBudget?: string;
  unallocatedBudget?: string;
}
export interface Project {
  id: string; name: string; description?: string; status: string; ownerId: string;
  owner: { id?: string; name: string; email?: string };
  access?: { isOwner: boolean; permission: string };
  permission?: string;
  financialSummary?: FinancialSummary;
  totalBudget?: string; totalExpenses?: string; remainingBudget?: string; usagePercentage?: number;
}
export interface Scope {
  id: string; name: string; status: string; plannedBudget: string; totalExpenses: string;
  remainingBudget: string; usagePercentage: number; isOverBudget: boolean;
}
export interface Expense {
  id: string; description: string; amount: string; expenseDate: string; paymentStatus: string; paymentMethod?: string;
  scope?: { id: string; name: string }; category?: { id?: string; name: string }; supplier?: { id?: string; name: string };
  documentNumber?: string; projectName?: string;
}
export interface DashboardData {
  project?: { id: string; name: string; status: string };
  summary: {
    activeProjects?: number; totalBudget: string; totalExpenses: string; paidExpenses?: string; pendingExpenses?: string;
    remainingBudget: string; usagePercentage?: number; plannedScopeBudget?: string; unallocatedBudget?: string;
    scopedExpenses?: string; unscopedExpenses?: string; isOverBudget?: boolean; overBudgetScopes?: number;
  };
  projects?: Project[]; scopes?: Scope[]; recentExpenses: Expense[];
  expensesByScope?: { name: string; value: string }[];
  expensesByMonth?: { month: string; value: string }[];
}
export interface User {
  id: string; name: string; email: string; role: string; status: string; createdAt: string; lastLoginAt?: string;
  _count?: { ownedProjects: number; projectAccesses: number };
}

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? 'https://build-balance-api.vercel.app' : 'http://localhost:3000')
).replace(/\/+$/, '');

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders(headers, { getState }) {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  }
});

const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) api.dispatch(signOut());
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Dashboard', 'Project', 'Scope', 'Expense', 'User', 'Access', 'Supplier', 'Category', 'Audit'],
  endpoints: (builder) => ({
    login: builder.mutation<{ accessToken: string; user: import('../auth/authSlice').SessionUser }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body })
    }),
    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body })
    }),
    dashboard: builder.query<DashboardData, void>({ query: () => '/dashboard', providesTags: ['Dashboard'] }),
    projectDashboard: builder.query<DashboardData, string>({ query: (id) => `/projects/${id}/dashboard`, providesTags: ['Dashboard'] }),
    projects: builder.query<Pagination<Project>, boolean | void>({
      query: (all) => `/projects?limit=100${all ? '&view=all' : ''}`, providesTags: ['Project']
    }),
    project: builder.query<Project, string>({ query: (id) => `/projects/${id}`, providesTags: ['Project'] }),
    createProject: builder.mutation<Project, Record<string, unknown>>({
      query: (body) => ({ url: '/projects', method: 'POST', body }), invalidatesTags: ['Project', 'Dashboard']
    }),
    updateProject: builder.mutation<Project, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }), invalidatesTags: ['Project', 'Dashboard']
    }),
    completeProject: builder.mutation<Project, string>({
      query: (id) => ({ url: `/projects/${id}/complete`, method: 'PATCH' }),
      invalidatesTags: ['Project', 'Dashboard']
    }),
    deleteProjectPermanently: builder.mutation<{ message: string }, { id: string; confirmation: string }>({
      query: ({ id, confirmation }) => ({
        url: `/projects/${id}/permanent`, method: 'DELETE', body: { confirmation }
      }),
      invalidatesTags: ['Project', 'Dashboard', 'Scope', 'Expense', 'Access', 'Audit']
    }),
    scopes: builder.query<Scope[], string>({ query: (projectId) => `/projects/${projectId}/scopes`, providesTags: ['Scope'] }),
    createScope: builder.mutation<Scope, { projectId: string; body: Record<string, unknown> }>({
      query: ({ projectId, body }) => ({ url: `/projects/${projectId}/scopes`, method: 'POST', body }), invalidatesTags: ['Scope', 'Dashboard']
    }),
    expenses: builder.query<Pagination<Expense>, string>({
      query: (projectId) => `/projects/${projectId}/expenses?limit=100`, providesTags: ['Expense']
    }),
    createExpense: builder.mutation<Expense, { projectId: string; body: Record<string, unknown> }>({
      query: ({ projectId, body }) => ({ url: `/projects/${projectId}/expenses`, method: 'POST', body }),
      invalidatesTags: ['Expense', 'Dashboard', 'Project', 'Scope']
    }),
    cancelExpense: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }), invalidatesTags: ['Expense', 'Dashboard', 'Project', 'Scope']
    }),
    users: builder.query<Pagination<User>, void>({ query: () => '/admin/users?limit=100', providesTags: ['User'] }),
    createUser: builder.mutation<User, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }), invalidatesTags: ['User']
    }),
    updateUser: builder.mutation<User, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: ['User']
    }),
    setUserStatus: builder.mutation<User, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/admin/users/${id}/status`, method: 'PATCH', body: { status } }), invalidatesTags: ['User']
    }),
    userAccess: builder.query<Record<string, unknown>, string>({
      query: (id) => `/admin/users/${id}/project-access`, providesTags: ['Access']
    }),
    projectAccess: builder.query<{ id: string; name: string; owner: User; accesses: Array<{ id: string; permission: string; user: User }> }, string>({
      query: (id) => `/admin/projects/${id}/access`, providesTags: ['Access']
    }),
    grantAccess: builder.mutation<unknown, { projectId: string; userId: string; permission: string }>({
      query: ({ projectId, ...body }) => ({ url: `/admin/projects/${projectId}/access`, method: 'POST', body }), invalidatesTags: ['Access', 'Project']
    }),
    changeAccess: builder.mutation<unknown, { projectId: string; accessId: string; permission: string }>({
      query: ({ projectId, accessId, permission }) => ({
        url: `/admin/projects/${projectId}/access/${accessId}`, method: 'PATCH', body: { permission }
      }),
      invalidatesTags: ['Access', 'Project']
    }),
    removeAccess: builder.mutation<unknown, { projectId: string; accessId: string }>({
      query: ({ projectId, accessId }) => ({ url: `/admin/projects/${projectId}/access/${accessId}`, method: 'DELETE' }), invalidatesTags: ['Access', 'Project']
    }),
    suppliers: builder.query<Array<{ id: string; name: string; document?: string; phone?: string; email?: string }>, void>({
      query: () => '/suppliers', providesTags: ['Supplier']
    }),
    createSupplier: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: '/suppliers', method: 'POST', body }), invalidatesTags: ['Supplier']
    }),
    categories: builder.query<Array<{ id: string; name: string; active: boolean }>, void>({
      query: () => '/categories', providesTags: ['Category']
    }),
    createCategory: builder.mutation<unknown, { name: string }>({
      query: (body) => ({ url: '/categories', method: 'POST', body }), invalidatesTags: ['Category']
    }),
    audit: builder.query<Array<{ id: string; action: string; entityType: string; entityId: string; createdAt: string; actor: User }>, void>({
      query: () => '/admin/audit', providesTags: ['Audit']
    })
  })
});

export const {
  useLoginMutation, useChangePasswordMutation, useDashboardQuery, useProjectDashboardQuery,
  useProjectsQuery, useProjectQuery, useCreateProjectMutation, useUpdateProjectMutation,
  useCompleteProjectMutation, useDeleteProjectPermanentlyMutation,
  useScopesQuery, useCreateScopeMutation, useExpensesQuery, useCreateExpenseMutation, useCancelExpenseMutation,
  useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useSetUserStatusMutation, useUserAccessQuery,
  useProjectAccessQuery, useGrantAccessMutation, useChangeAccessMutation, useRemoveAccessMutation,
  useSuppliersQuery, useCreateSupplierMutation, useCategoriesQuery, useCreateCategoryMutation, useAuditQuery
} = api;
