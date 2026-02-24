import { expect } from 'chai';
import sinon from 'sinon';
import * as SupportController from '../controllers/support.controller.js';
import * as EmailService from '../services/email.service.js';

describe('Support Controller', () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  const makeRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
  };

  describe('submitTicket', () => {
    it('should send email and return 200', async () => {
      sandbox.stub(EmailService, 'sendEmail').resolves({ messageId: '1' });
      const req = { body: { name: 'Test', email: 'test@example.com', subject: 'Hi', message: 'Hello' } };
      const res = makeRes();

      await SupportController._submitTicket(req, res);

      expect(EmailService.sendEmail.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Support ticket sent' })).to.be.true;
    });

    it('should return 400 on validation failure', async () => {
      const req = { body: { name: '', email: 'not-an-email' } };
      const res = makeRes();
      await SupportController._submitTicket(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });
  });

  describe('submitBooking', () => {
    it('should send email and return 200', async () => {
      sandbox.stub(EmailService, 'sendEmail').resolves({ messageId: '2' });
      const req = { body: { name: 'Booking', email: 'user@x.com', subject: 'Book', message: 'Please' } };
      const res = makeRes();
      await SupportController._submitBooking(req, res);
      expect(EmailService.sendEmail.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Booking request sent' })).to.be.true;
    });
  });
});
