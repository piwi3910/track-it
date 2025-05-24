# Default Users

After deployment, you can log in with these default users:

## Admin User
- Email: `admin@trackit.com`
- Password: `admin123`
- Role: ADMIN

## Demo User
- Email: `demo@trackit.com`
- Password: `demo123`
- Role: MEMBER

## Creating Users Manually

To create additional users, you can use the following commands:

1. Generate a password hash:
```bash
kubectl exec -n trackit deployment/backend -- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
```

2. Insert the user into the database:
```bash
kubectl exec -n trackit postgres-0 -- psql -U trackit -d trackit -c "INSERT INTO users (id, email, name, \"passwordHash\", role, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'user@example.com', 'User Name', 'HASH_FROM_STEP_1', 'MEMBER', NOW(), NOW());"
```

Replace:
- `YOUR_PASSWORD` with the desired password
- `user@example.com` with the user's email
- `User Name` with the user's display name
- `HASH_FROM_STEP_1` with the hash generated in step 1
- `MEMBER` with `ADMIN` if you want admin privileges