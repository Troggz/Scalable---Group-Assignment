// POST /payment-notifications  --  InvoicePaid, from payments.

import { Router } from 'express';
import * as notifications from '../notifications.js';
import { StudioUnavailable } from '../studio.js';
import { fail, requireObject, requireString, route } from '../http.js';

export const notificationRoutes = Router();

notificationRoutes.post('/payment-notifications', route(async (req, res) => {
  const body = requireObject(req.body);
  const invoiceId = requireString(body.invoiceId, 'invoiceId', { maxLength: 128 });
  const reference = requireString(body.reference, 'reference', { maxLength: 128 });
  const purpose = requireString(body.purpose, 'purpose', { maxLength: 64 });

  try {
    const result = await notifications.invoicePaid({ invoiceId, reference, purpose });

    if (result.unknown) {
      // 422 rather than 404: the contract says payments should stop retrying,
      // and it stops on any 4xx. Retrying would never help here.
      return fail(res, 422, notifications.UNKNOWN_REFERENCE, `No request ${reference}`);
    }

    // `applied` is what the demo prints: true the first time, false when the
    // same callback is delivered again.
    res.status(200).json({
      applied: result.applied ?? false,
      commissionId: result.commissionId,
    });
  } catch (err) {
    if (err instanceof StudioUnavailable) {
      // The request is BOOKED and the slot is taken; only the hand-off to studio
      // failed. 503 makes payments retry, and the retry picks up where this left
      // off instead of starting again.
      return fail(res, 503, 'StudioUnavailable', err.message);
    }
    throw err;
  }
}));
