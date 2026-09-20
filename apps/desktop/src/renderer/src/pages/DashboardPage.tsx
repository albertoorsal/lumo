import { Permission } from '@app/shared'
import { useAppDispatch } from '../app/hooks'
import { logout } from '../features/auth/authSlice'
import { api, useGetMeQuery, useGetUsersQuery } from '../features/auth/authApi'
import { Can } from '../shared/Can'

function UserTable() {
  const { data: users, isLoading, error } = useGetUsersQuery()

  if (isLoading) return <p>Loading users...</p>
  if (error) return <p role="alert">Cannot load users.</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Nombre</th>
          <th>Roles</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {users?.map((u) => (
          <tr key={u.id}>
            <td>{u.username}</td>
            <td>{u.fullName ?? '—'}</td>
            <td>{u.roles.join(', ') || '—'}</td>
            <td>{u.isActive ? 'Activo' : 'Inactivo'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const { data: me } = useGetMeQuery()

  async function handleLogout() {
    await dispatch(logout())
    dispatch(api.util.resetApiState()) // clear cache from prev user
  }

  return (
    <main className="dashboard">
      <header>
        <div>
          <h1>{me?.fullName ?? me?.email}</h1>
          <p>Roles: {me?.roles.join(', ') || 'sin roles'}</p>
        </div>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <Can
        permission={Permission.USERS_READ}
        fallback={<p>No tienes permiso para ver la lista de usuarios.</p>}
      >
        <section>
          <h2>Usuarios</h2>
          <UserTable />
          <Can permission={Permission.USERS_CREATE}>
            <button>Nuevo usuario</button>
          </Can>
        </section>
      </Can>

      <details>
        <summary>Permisos efectivos ({me?.permissions.length ?? 0})</summary>
        <ul>
          {me?.permissions.map((p) => (
            <li key={p}>
              <code>{p}</code>
            </li>
          ))}
        </ul>
      </details>
    </main>
  )
}
