import { getServerSupabaseClient, getServerSupabaseConfig } from '../../src/lib/serverSupabase';
import { calculateSLA } from '../../src/lib/sla/calculator';

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const cronSecret = process.env.CRON_SECRET || 'thrill_cron_dev_secret';
  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid CRON_SECRET' }),
    };
  }

  const config = getServerSupabaseConfig();
  let updatedCount = 0;
  const evaluatedAssets: any[] = [];

  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      const { data: assets, error } = await supabase
        .from('content_assets')
        .select('id, title, status, sla_expires_at, is_sla_breached')
        .not('status', 'in', '("READY_TO_PUBLISH","PUBLISHED")');

      if (!error && assets) {
        for (const asset of assets) {
          const sla = calculateSLA(asset.sla_expires_at);
          if (sla.isBreached && !asset.is_sla_breached) {
            await supabase
              .from('content_assets')
              .update({ is_sla_breached: true })
              .eq('id', asset.id);
            updatedCount++;
          }
          evaluatedAssets.push({
            id: asset.id,
            title: asset.title,
            isBreached: sla.isBreached,
            urgencyLevel: sla.urgencyLevel,
            hoursRemaining: sla.hoursRemaining,
          });
        }
      }
    } catch (err: any) {
      console.warn('SLA Check Supabase error:', err.message);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'SLA check completed',
      timestamp: new Date().toISOString(),
      updatedBreaches: updatedCount,
      evaluated: evaluatedAssets.length,
      assets: evaluatedAssets,
    }),
  };
};
