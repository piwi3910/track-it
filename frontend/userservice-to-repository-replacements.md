# UserService to Repository Replacements for users.router.ts

## Direct Replacements

### 1. getUserById → findById
```typescript
// Line 241
- user = await userService.getUserById(newUser.id);
+ user = await repositories.users.findById(newUser.id);

// Line 382
- const user = await userService.getUserById(ctx.user.id);
+ const user = await repositories.users.findById(ctx.user.id);

// Line 428
- const user = await userService.getUserById(ctx.user.id);
+ const user = await repositories.users.findById(ctx.user.id);

// Line 449
- await userService.getUserById(ctx.user.id);
+ await repositories.users.findById(ctx.user.id);

// Line 459
- const refreshedUser = await userService.getUserById(ctx.user.id);
+ const refreshedUser = await repositories.users.findById(ctx.user.id);

// Line 507
- const user = await userService.getUserById(ctx.user.id);
+ const user = await repositories.users.findById(ctx.user.id);

// Line 555
- const user = await userService.getUserById(ctx.user.id);
+ const user = await repositories.users.findById(ctx.user.id);

// Line 592
- const user = await userService.getUserById(input.userId);
+ const user = await repositories.users.findById(input.userId);

// Line 659
- const user = await userService.getUserById(input.userId);
+ const user = await repositories.users.findById(input.userId);

// Line 721
- const user = await userService.getUserById(input.userId);
+ const user = await repositories.users.findById(input.userId);

// Line 758
- const user = await userService.getUserById(input.userId);
+ const user = await repositories.users.findById(input.userId);

// Line 783
- const user = await userService.getUserById(ctx.user.id);
+ const user = await repositories.users.findById(ctx.user.id);
```

### 2. getUserByEmail → findByEmail
```typescript
// Line 140
- const user = await userService.getUserByEmail(input.email);
+ const user = await repositories.users.findByEmail(input.email);

// Line 207
- user = await userService.getUserByEmail(payload.email);
+ user = await repositories.users.findByEmail(payload.email);

// Line 288
- const existingUser = await userService.getUserByEmail(payload.email);
+ const existingUser = await repositories.users.findByEmail(payload.email);

// Line 314
- const existingUser = await userService.getUserByEmail(input.email);
+ const existingUser = await repositories.users.findByEmail(input.email);

// Line 622
- const existingUser = await userService.getUserByEmail(input.email);
+ const existingUser = await repositories.users.findByEmail(input.email);

// Line 667
- const existingUser = await userService.getUserByEmail(input.email);
+ const existingUser = await repositories.users.findByEmail(input.email);
```

### 3. getUserByGoogleId → findByGoogleId
```typescript
// Line 203
- let user = await userService.getUserByGoogleId(payload.sub);
+ let user = await repositories.users.findByGoogleId(payload.sub);
```

### 4. getAllUsers → findAll
```typescript
// Line 578
- const users = await userService.getAllUsers();
+ const users = await repositories.users.findAll();
```

### 5. createUser → create
```typescript
// Line 225
- const newUser = await userService.createUser({
+ const newUser = await repositories.users.create({

// Line 331
- const newUser = await userService.createUser({
+ const newUser = await repositories.users.create({

// Line 638
- const newUser = await userService.createUser(userData);
+ const newUser = await repositories.users.create(userData);
```

### 6. updateUser → update
```typescript
// Line 446
- await userService.updateUser(ctx.user.id, updateData);
+ await repositories.users.update(ctx.user.id, updateData);

// Line 682
- const updatedUser = await userService.updateUser(input.userId, updateData);
+ const updatedUser = await repositories.users.update(input.userId, updateData);
```

### 7. deleteUser → delete
```typescript
// Line 735
- await userService.deleteUser(input.userId);
+ await repositories.users.delete(input.userId);
```

### 8. updateUserRole → updateRole
```typescript
// Line 599
- const updatedUser = await userService.updateUserRole(input.userId, input.role);
+ const updatedUser = await repositories.users.updateRole(input.userId, input.role as UserRole);
```

### 9. updateLoginTimestamp → updateLastLogin
```typescript
// Line 156
- await userService.updateLoginTimestamp(user.id);
+ await repositories.users.updateLastLogin(user.id);

// Line 222
- await userService.updateLoginTimestamp(user.id);
+ await repositories.users.updateLastLogin(user.id);
```

## Custom Implementations Needed

### 1. verifyPassword (Line 148)
```typescript
// Replace:
- const isPasswordValid = await userService.verifyPassword(input.password, user.passwordHash);

// With:
+ const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
```

### 2. updateUserAvatar (Lines 442, 514)
```typescript
// Replace:
- await userService.updateUserAvatar(ctx.user.id, input.avatarUrl);
- const updatedUser = await userService.updateUserAvatar(ctx.user.id, input.avatarUrl);

// With inline validation and update:
+ // Validate avatar format if provided
+ if (input.avatarUrl && input.avatarUrl.startsWith('data:image/')) {
+   const matches = input.avatarUrl.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/);
+   if (!matches) {
+     throw new Error('Unsupported image format');
+   }
+   const base64Data = input.avatarUrl.split(',')[1];
+   const sizeInBytes = (base64Data.length * 3) / 4;
+   if (sizeInBytes > 5 * 1024 * 1024) { // 5MB limit
+     throw new Error('Image size too large');
+   }
+ }
+ const updatedUser = await repositories.users.update(ctx.user.id, { avatarUrl: input.avatarUrl });
```

### 3. connectGoogleAccount (Lines 213, 232)
```typescript
// Replace:
- await userService.connectGoogleAccount(
-   user.id,
-   payload.sub,
-   input.idToken,
-   undefined,
-   { ...payload, id: payload.sub }
- );

// With:
+ await repositories.users.update(user.id, {
+   googleId: payload.sub,
+   googleAccessToken: input.idToken,
+   googleRefreshToken: undefined,
+   googleProfile: { ...payload, id: payload.sub }
+ });
```

### 4. disconnectGoogleAccount (Lines 566, 799)
```typescript
// Replace:
- await userService.disconnectGoogleAccount(ctx.user.id);

// With:
+ await repositories.users.update(ctx.user.id, {
+   googleId: null,
+   googleAccessToken: null,
+   googleRefreshToken: null,
+   googleProfile: null
+ });
```

### 5. updateUserPreferences (Line 455)
```typescript
// Replace:
- await userService.updateUserPreferences(ctx.user.id, input.preferences);

// With:
+ await repositories.users.update(ctx.user.id, {
+   preferences: input.preferences as Prisma.JsonValue
+ });
```

### 6. getUserDeletionStats (Line 700)
```typescript
// Replace:
- return await userService.getUserDeletionStats(input.userId);

// With (needs implementation):
+ // Count related entities
+ const [tasksCount, commentsCount, templatesCount] = await Promise.all([
+   repositories.tasks.count({ where: { userId: input.userId } }),
+   repositories.comments.count({ where: { userId: input.userId } }),
+   repositories.templates.count({ where: { userId: input.userId } })
+ ]);
+ 
+ return {
+   tasksCount,
+   commentsCount,
+   templatesCount,
+   totalCount: tasksCount + commentsCount + templatesCount
+ };
```

### 7. updateUserPassword (Line 764)
```typescript
// Replace:
- await userService.updateUserPassword(input.userId, input.newPassword);

// With:
+ const passwordHash = await bcrypt.hash(input.newPassword, 10);
+ await repositories.users.updatePassword(input.userId, passwordHash);
```

## Additional Imports Needed

Add these imports at the top of the file:
```typescript
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
```

## Notes

1. Make sure to handle the password correctly in createUser (lines 331, 638) - need to hash the password before creating
2. The create user at line 225 doesn't have a password, which is correct for Google auth
3. Error handling should remain the same as it's already wrapped in safeProcedure
4. The normalizeUserData function can remain as is since it works with the User type from Prisma