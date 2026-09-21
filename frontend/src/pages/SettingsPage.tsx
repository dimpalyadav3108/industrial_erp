import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BadgeIndianRupee, Building2, FileDigit, Globe2, Save, Settings2 } from "lucide-react";
import { getCompanySettings, saveCompanySettings } from "../services/settings.service";
import type { CompanySettingsPayload } from "../types/settings";

interface SettingsForm {
  companyName: string; legalName: string; gstNumber: string; panNumber: string;
  email: string; phone: string; website: string; address: string; city: string;
  state: string; country: string; postalCode: string; currency: string; timezone: string;
  financialYearStart: string; defaultTaxPercent: string; estimatePrefix: string;
  quotationPrefix: string; productionPrefix: string; dispatchPrefix: string;
}

const initialForm: SettingsForm = {
  companyName: "Industrial ERP", legalName: "", gstNumber: "", panNumber: "",
  email: "", phone: "", website: "", address: "", city: "", state: "Gujarat",
  country: "India", postalCode: "", currency: "INR", timezone: "Asia/Kolkata",
  financialYearStart: "4", defaultTaxPercent: "18", estimatePrefix: "EST",
  quotationPrefix: "QUO", productionPrefix: "PRO", dispatchPrefix: "DSP",
};

const emptyToNull = (value: string) => value.trim() || null;

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError("");
        const settings = await getCompanySettings();
        setForm({
          companyName: settings.companyName, legalName: settings.legalName ?? "",
          gstNumber: settings.gstNumber ?? "", panNumber: settings.panNumber ?? "",
          email: settings.email ?? "", phone: settings.phone ?? "",
          website: settings.website ?? "", address: settings.address ?? "",
          city: settings.city ?? "", state: settings.state ?? "", country: settings.country,
          postalCode: settings.postalCode ?? "", currency: settings.currency,
          timezone: settings.timezone, financialYearStart: String(settings.financialYearStart),
          defaultTaxPercent: String(settings.defaultTaxPercent), estimatePrefix: settings.estimatePrefix,
          quotationPrefix: settings.quotationPrefix, productionPrefix: settings.productionPrefix,
          dispatchPrefix: settings.dispatchPrefix,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load settings");
      } finally { setLoading(false); }
    };
    void load();
  }, []);

  const updateField = (field: keyof SettingsForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setSuccess("");
      const payload: CompanySettingsPayload = {
        companyName: form.companyName.trim(), legalName: emptyToNull(form.legalName),
        gstNumber: emptyToNull(form.gstNumber), panNumber: emptyToNull(form.panNumber),
        email: emptyToNull(form.email), phone: emptyToNull(form.phone),
        website: emptyToNull(form.website), address: emptyToNull(form.address),
        city: emptyToNull(form.city), state: emptyToNull(form.state),
        country: form.country.trim(), postalCode: emptyToNull(form.postalCode),
        currency: form.currency.trim().toUpperCase(), timezone: form.timezone.trim(),
        financialYearStart: Number(form.financialYearStart),
        defaultTaxPercent: Number(form.defaultTaxPercent),
        estimatePrefix: form.estimatePrefix.trim().toUpperCase(),
        quotationPrefix: form.quotationPrefix.trim().toUpperCase(),
        productionPrefix: form.productionPrefix.trim().toUpperCase(),
        dispatchPrefix: form.dispatchPrefix.trim().toUpperCase(),
      };
      const settings = await saveCompanySettings(payload);
      setForm((current) => ({ ...current, estimatePrefix: settings.estimatePrefix,
        quotationPrefix: settings.quotationPrefix, productionPrefix: settings.productionPrefix,
        dispatchPrefix: settings.dispatchPrefix }));
      setSuccess("Company settings saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings");
    } finally { setSaving(false); }
  };

  if (loading) return <section className="settings-page"><div className="settings-loading"><div className="loading-spinner" /><h2>Loading settings...</h2></div></section>;

  return <section className="settings-page">
    <div className="settings-heading"><div><span className="page-eyebrow">SYSTEM CONFIGURATION</span><h1>Settings</h1><p>Manage company identity, tax defaults and ERP document numbering.</p></div><div className="settings-heading-icon"><Settings2 size={28} /></div></div>
    <form onSubmit={submit}>
      {error && <div className="page-error">{error}</div>}{success && <div className="settings-success">{success}</div>}
      <div className="settings-section">
        <div className="settings-section-title"><Building2 /><div><h2>Company profile</h2><p>Legal and contact information shown on business documents.</p></div></div>
        <div className="settings-form-grid">
          <label>Company name<input required value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} /></label>
          <label>Legal name<input value={form.legalName} onChange={(e) => updateField("legalName", e.target.value)} /></label>
          <label>GST number<input value={form.gstNumber} onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())} /></label>
          <label>PAN number<input value={form.panNumber} onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())} /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></label>
          <label className="span-two">Website<input value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://example.com" /></label>
          <label className="span-two">Registered address<textarea rows={3} value={form.address} onChange={(e) => updateField("address", e.target.value)} /></label>
          <label>City<input value={form.city} onChange={(e) => updateField("city", e.target.value)} /></label>
          <label>State<input value={form.state} onChange={(e) => updateField("state", e.target.value)} /></label>
          <label>Country<input required value={form.country} onChange={(e) => updateField("country", e.target.value)} /></label>
          <label>Postal code<input value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} /></label>
        </div>
      </div>
      <div className="settings-two-column">
        <div className="settings-section"><div className="settings-section-title"><Globe2 /><div><h2>Regional &amp; finance</h2><p>Defaults used across commercial records.</p></div></div><div className="settings-form-grid compact">
          <label>Currency<input required maxLength={3} value={form.currency} onChange={(e) => updateField("currency", e.target.value.toUpperCase())} /></label>
          <label>Timezone<select value={form.timezone} onChange={(e) => updateField("timezone", e.target.value)}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option></select></label>
          <label>Financial year begins<select value={form.financialYearStart} onChange={(e) => updateField("financialYearStart", e.target.value)}><option value="1">January</option><option value="4">April</option><option value="7">July</option><option value="10">October</option></select></label>
          <label>Default tax (%)<input required type="number" min="0" max="100" step="0.01" value={form.defaultTaxPercent} onChange={(e) => updateField("defaultTaxPercent", e.target.value)} /></label>
        </div></div>
        <div className="settings-section"><div className="settings-section-title"><FileDigit /><div><h2>Document prefixes</h2><p>Prefixes for newly generated ERP numbers.</p></div></div><div className="settings-form-grid compact">
          <label>Estimate<input required value={form.estimatePrefix} onChange={(e) => updateField("estimatePrefix", e.target.value.toUpperCase())} /></label>
          <label>Quotation<input required value={form.quotationPrefix} onChange={(e) => updateField("quotationPrefix", e.target.value.toUpperCase())} /></label>
          <label>Production<input required value={form.productionPrefix} onChange={(e) => updateField("productionPrefix", e.target.value.toUpperCase())} /></label>
          <label>Dispatch<input required value={form.dispatchPrefix} onChange={(e) => updateField("dispatchPrefix", e.target.value.toUpperCase())} /></label>
        </div></div>
      </div>
      <div className="settings-save-bar"><div><BadgeIndianRupee /><span>Changes apply to future ERP records.</span></div><button className="primary-action" disabled={saving}><Save size={18} />{saving ? "Saving..." : "Save settings"}</button></div>
    </form>
  </section>;
}
