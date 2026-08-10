export default {
  async fetch() {
    const configured = Boolean(process.env.DATABASE_URL && process.env.SYNC_KEY);
    return Response.json({
      ok: true,
      cloudConfigured: configured,
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      syncKeyConfigured: Boolean(process.env.SYNC_KEY)
    }, { headers: { 'cache-control': 'no-store' } });
  }
};
