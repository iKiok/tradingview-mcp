import { z } from 'zod';
import { jsonResult } from './_format.js';
import { booleanParam } from './_schema.js';
import * as core from '../core/alerts.js';

export function registerAlertTools(server) {
  server.tool('alert_create', 'Create a price alert on the current chart symbol via TradingView\'s alert API', {
    condition: z.string().describe('Alert condition: "crossing", "greater_than", or "less_than"'),
    price: z.coerce.number().describe('Price level for the alert'),
    message: z.string().optional().describe('Alert message'),
  }, async ({ condition, price, message }) => {
    try { return jsonResult(await core.create({ condition, price, message })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('alert_list', 'List active alerts', {}, async () => {
    try { return jsonResult(await core.list()); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('alert_delete', 'Delete a specific alert by id, or all active alerts', {
    alert_id: z.coerce.number().optional().describe('Alert id to delete (from alert_list)'),
    delete_all: booleanParam().optional().describe('Delete all active alerts (also needs confirm)'),
    confirm: z.string().optional().describe('Required with delete_all: exactly "DELETE_ALL_ALERTS"'),
  }, async ({ alert_id, delete_all, confirm }) => {
    try { return jsonResult(await core.deleteAlerts({ alert_id, delete_all, confirm })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });
}
