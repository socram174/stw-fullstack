import { hashPassword } from 'better-auth/crypto';

export async function provisionOwner(auth, { email, name = 'Owner', password }) {
    email = email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    if (typeof password !== 'string' || password.length < 16 || password.length > 128) {
        throw new Error('Use a password between 16 and 128 characters.');
    }
    const { adapter } = await auth.$context;
    const passwordHash = await hashPassword(password);
    return adapter.transaction(async (transaction) => {
        if (await transaction.count({ model: 'user' }) > 0) throw new Error('An owner account already exists. No account was created.');
        const now = new Date();
        const user = await transaction.create({ model: 'user', data: {
            // A fixed primary key makes concurrent bootstrap attempts conflict instead of creating two owners.
            id: '000000000000000000000001', email, name: name.trim() || 'Owner', emailVerified: true,
            createdAt: now, updatedAt: now,
        }, forceAllowId: true });
        await transaction.create({ model: 'account', data: {
            userId: user.id, accountId: user.id, providerId: 'credential', password: passwordHash,
            createdAt: now, updatedAt: now,
        } });
        return { id: user.id, email: user.email };
    });
}
