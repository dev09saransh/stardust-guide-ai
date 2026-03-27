import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Building,
    Shield,
    Home,
    FileText,
    UserPlus,
    Lock,
    Eye,
    EyeOff,
    Calendar,
    Info,
    Layers,
    MapPin,
    Car,
    Gem,
    Plus,
    Trash2
} from 'lucide-react';
import { InputField, MaskedInput, DropdownSelector } from './FormInputs';
import { SectionCard, ToggleSwitch } from './DisplayComponents';
import { FormLayoutWrapper, UploadComponent } from './FormLayout';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';
const AI_SERVICE_URL = API.replace(':5001/api', ':5005');

const UniversalVaultForm = ({ category, onSave, onCancel, initialData, showToast, shake, glow }) => {
    const [formData, setFormData] = useState(initialData?.metadata || {});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [cardBenefits, setCardBenefits] = useState(null);
    const [isLoadingBenefits, setIsLoadingBenefits] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [customFields, setCustomFields] = useState(initialData?.metadata?.customFields || []);

    const fetchCardBenefits = async () => {
        if (!formData.bank || !formData.network) return;

        setIsLoadingBenefits(true);
        try {
            const response = await fetch(`${AI_SERVICE_URL}/card-benefits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank: formData.bank || '',
                    network: formData.network || '',
                    variant: formData.variant || ''
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "AI Service Error");
            }
            const data = await response.json();
            setCardBenefits(data.benefits);
        } catch (err) {
            console.error("Fetch benefits error:", err);
            setCardBenefits("ERROR: " + err.message);
        } finally {
            setIsLoadingBenefits(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('stardust_token');
            const { _showPass, _pendingFile, _uploading, ...cleanFormData } = formData;
            const finalMetadata = { ...cleanFormData, customFields: customFields.filter(f => f.label.trim()) };
            const assetTitle = finalMetadata.bank || finalMetadata.provider || finalMetadata.siteName || finalMetadata.docName || finalMetadata.name || finalMetadata.propertyTitle || finalMetadata.makeModel || finalMetadata.itemDescription || `New ${category}`;

            if (initialData?.asset_id) {
                // Update mode
                await axios.put(`${API}/assets/${initialData.asset_id}`, {
                    category,
                    title: assetTitle,
                    metadata: finalMetadata,
                    is_encrypted: initialData.is_encrypted
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (showToast) showToast(`${category} updated successfully`, 'success');
            } else {
                // Create mode
                await axios.post(`${API}/assets`, {
                    category,
                    title: assetTitle,
                    metadata: finalMetadata
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (showToast) showToast(`New ${category} added to vault`, 'success');
            }

            onSave(formData);
        } catch (err) {
            setError('Failed to save asset. Please try again.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const renderCategoryForm = () => {
        switch (category) {
            case 'Credit Card':
                return (
                    <>
                        <SectionCard title="Card Metadata" icon={CreditCard}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DropdownSelector
                                    label="Bank / Issuer Name"
                                    required
                                    options={['HDFC BANK', 'ICICI BANK', 'SBI', 'AXIS', 'AMEX']}
                                    value={formData.bank || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, bank: e.target.value });
                                        setCardBenefits(null);
                                    }}
                                />
                                <DropdownSelector
                                    label="Card Network"
                                    required
                                    options={['Visa', 'MasterCard', 'Amex', 'RuPay', 'Discover']}
                                    value={formData.network || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, network: e.target.value });
                                        setCardBenefits(null);
                                    }}
                                />
                                <DropdownSelector
                                    label="Card Type"
                                    required
                                    options={['Credit', 'Debit', 'Forex']}
                                    value={formData.cardType || ''}
                                    onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                                />
                                <InputField
                                    label="Name on Card"
                                    placeholder="e.g. John Doe"
                                    value={formData.nameOnCard || ''}
                                    onChange={(e) => setFormData({ ...formData, nameOnCard: e.target.value })}
                                />
                                <MaskedInput
                                    label="Last 4 Digits"
                                    helperText="Privacy-first: We never store full card numbers."
                                    value={formData.last4 || ''}
                                    onChange={(val) => setFormData({ ...formData, last4: val })}
                                />
                                <InputField
                                    label="Card Variant (Optional)"
                                    placeholder="e.g. Millennia / Regalia"
                                    onChange={(e) => {
                                        setFormData({ ...formData, variant: e.target.value });
                                        setCardBenefits(null);
                                    }}
                                />
                            </div>

                            <div className="mt-8 pt-8 border-t border-[var(--border)]">
                                <button
                                    type="button"
                                    onClick={fetchCardBenefits}
                                    disabled={isLoadingBenefits || !formData.bank || !formData.network}
                                    className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 font-bold transition-all border ${isLoadingBenefits || !formData.bank || !formData.network
                                        ? 'bg-[var(--surface-glass)] text-[var(--text-secondary)] border-[var(--border)] cursor-not-allowed opacity-50'
                                        : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-white hover:shadow-lg hover:shadow-blue-500/20'
                                        }`}
                                >
                                    {isLoadingBenefits ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span>AI Thinking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Shield size={18} />
                                            <span>Get AI Card Benefits</span>
                                        </>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {cardBenefits && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 p-6 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border)] relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-full bg-[var(--primary)]/5 -skew-x-12 translate-x-16" />
                                            <div className="relative z-10">
                                                <div className="flex items-center space-x-2 mb-4 text-[var(--primary)]">
                                                    <Info size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vault Intelligence Insights</span>
                                                </div>
                                                <div className="space-y-3 whitespace-pre-line text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                                                    {cardBenefits}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Bank Account':
                return (
                    <>
                        <SectionCard title="Account Details" icon={Building}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DropdownSelector
                                    label="Bank Name"
                                    options={['HDFC', 'ICICI', 'SBI', 'HSBC', 'KOTAK']}
                                    value={formData.bank || ''}
                                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                                />
                                <DropdownSelector
                                    label="Account Type"
                                    options={['Savings', 'Current', 'Fixed Deposit', 'PPF']}
                                    value={formData.accountType || ''}
                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                />
                                <MaskedInput
                                    label="Account Number (Last 4 Digits)"
                                    helperText="We only need the last 4 digits for legacy claim identification."
                                    value={formData.last4 || ''}
                                    onChange={(val) => setFormData({ ...formData, last4: val })}
                                />
                            </div>
                        </SectionCard>
                        <SectionCard title="Branch & Security" icon={MapPin}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Branch Name / IFSC Code"
                                    placeholder="e.g. Koramangala or HDFC0001234"
                                    value={formData.branch || ''}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                />
                                <div className="mt-2">
                                    <ToggleSwitch
                                        label="Nominated at Bank?"
                                        enabled={formData.nomineeLinked || false}
                                        onChange={(val) => setFormData({ ...formData, nomineeLinked: val })}
                                    />
                                    <p className="text-[11px] text-[var(--text-secondary)] mt-2">Helps your family know if they need a death certificate or a full legal heirship certificate for claiming.</p>
                                </div>
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Insurance':
                return (
                    <>
                        <SectionCard title="Policy Overview" icon={Shield}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Insurance Provider" placeholder="e.g. HDFC Life" />
                                <DropdownSelector
                                    label="Policy Type"
                                    options={['Term Life', 'Health', 'Vehicle', 'Home', 'Travel']}
                                />
                                <InputField label="Policy Nickname" placeholder="Standard Term Cover" />
                                <MaskedInput
                                    label="Policy Last 4 Digits"
                                    value={formData.last4 || ''}
                                    onChange={(val) => setFormData({ ...formData, last4: val })}
                                />
                            </div>
                        </SectionCard>
                        <SectionCard title="Coverage & Renewal" icon={Layers}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Coverage Amount" placeholder="e.g. ₹1,00,00,000" />
                                <InputField label="Premium" placeholder="₹24,500/year" />
                                <InputField label="Renewal Date" type="date" />
                                <ToggleSwitch label="Nominee Linked?" />
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Property':
                return (
                    <>
                        <SectionCard title="Property Info" icon={Home}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Property Nickname / Short Address"
                                    placeholder="e.g. Godrej Woods Apt 104"
                                    value={formData.propertyTitle || ''}
                                    onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                                />
                                <DropdownSelector
                                    label="Property Type"
                                    options={['Flat/Apartment', 'Plot/Land', 'Commercial', 'Agricultural']}
                                    value={formData.propertyType || ''}
                                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                                />
                                <InputField
                                    label="City / State"
                                    placeholder="e.g. Pune, MH"
                                    value={formData.location || ''}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </SectionCard>
                        <SectionCard title="Documents & Ownership" icon={FileText}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Where are the physical papers?"
                                    placeholder="e.g. SBI Locker / Home Safe"
                                    value={formData.physicalPapers || ''}
                                    onChange={(e) => setFormData({ ...formData, physicalPapers: e.target.value })}
                                />
                                <InputField
                                    label="Co-owner Details (Optional)"
                                    placeholder="e.g. Joint with Spouse"
                                    value={formData.coOwner || ''}
                                    onChange={(e) => setFormData({ ...formData, coOwner: e.target.value })}
                                />
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Vehicle':
                return (
                    <>
                        <SectionCard title="Vehicle Info" icon={Car}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DropdownSelector
                                    label="Vehicle Type"
                                    options={['Two-Wheeler', 'Four-Wheeler', 'Commercial']}
                                    value={formData.vehicleType || ''}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                />
                                <InputField
                                    label="Make & Model"
                                    placeholder="e.g. Honda City / RE Classic 350"
                                    value={formData.makeModel || ''}
                                    onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                                />
                                <InputField
                                    label="Registration Number"
                                    placeholder="e.g. MH 01 AB 1234"
                                    value={formData.regNo || ''}
                                    onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                                />
                                <InputField
                                    label="Insurance Provider (Optional)"
                                    placeholder="e.g. Acko, ICICI Lombard"
                                    value={formData.insurance || ''}
                                    onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                                />
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Collectible':
                return (
                    <>
                        <SectionCard title="Valuable Details" icon={Gem}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DropdownSelector
                                    label="Item Type"
                                    options={['Gold/Jewelry', 'Art', 'Watch', 'Antique', 'Other']}
                                    value={formData.itemType || ''}
                                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                                />
                                <InputField
                                    label="Description / Nickname"
                                    placeholder="e.g. Grandmother's Gold Bangles"
                                    value={formData.itemDescription || ''}
                                    onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                                />
                                <InputField
                                    label="Physical Storage Location"
                                    placeholder="e.g. HDFC Bank Locker #45"
                                    value={formData.storageLocation || ''}
                                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                                />
                                <InputField
                                    label="Estimated Value / Purchase Price (Optional)"
                                    placeholder="e.g. ₹5,00,000"
                                    value={formData.estValue || ''}
                                    onChange={(e) => setFormData({ ...formData, estValue: e.target.value })}
                                />
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Legal Document':
                return (
                    <SectionCard title="Document Metadata" icon={FileText}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Document Name"
                                required
                                placeholder="e.g. Last Will"
                                value={formData.docName || ''}
                                onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
                            />
                            <DropdownSelector
                                label="Document Type"
                                options={['Will', 'Passport', 'Birth Cert', 'Marriage Cert', 'Aadhaar', 'PAN Card', 'Other']}
                                value={formData.docType || ''}
                                onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                            />
                            <InputField
                                label="Issuer"
                                placeholder="e.g. Govt of India"
                                value={formData.issuer || ''}
                                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                            />
                            <InputField
                                label="Year Issued"
                                placeholder="YYYY"
                                maxLength={4}
                                value={formData.yearIssued || ''}
                                onChange={(e) => setFormData({ ...formData, yearIssued: e.target.value })}
                            />
                        </div>
                        <div className="pt-6">
                            <UploadComponent
                                label="Secure Binary Upload"
                                file={formData._pendingFile || null}
                                existingFile={formData.uploadedFile || null}
                                uploading={formData._uploading || false}
                                onUpload={async (file) => {
                                    setFormData(prev => ({ ...prev, _uploading: true }));
                                    try {
                                        const token = localStorage.getItem('stardust_token');
                                        const fd = new FormData();
                                        fd.append('file', file);
                                        const res = await fetch(`${API}/uploads`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` },
                                            body: fd
                                        });
                                        if (!res.ok) throw new Error('Upload failed');
                                        const data = await res.json();
                                        setFormData(prev => ({
                                            ...prev,
                                            _pendingFile: null,
                                            _uploading: false,
                                            uploadedFile: data.file
                                        }));
                                    } catch (err) {
                                        console.error(err);
                                        setFormData(prev => ({ ...prev, _uploading: false }));
                                        if (showToast) showToast('File upload failed', 'error');
                                    }
                                }}
                                onRemove={async () => {
                                        if (formData.uploadedFile?.filename) {
                                            try {
                                                const token = localStorage.getItem('stardust_token');
                                                await fetch(`${API}/uploads/${formData.uploadedFile.filename}`, {
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                            } catch (err) { console.error(err); }
                                        }
                                        setFormData(prev => ({ ...prev, uploadedFile: null, _pendingFile: null }));
                                    }}
                                    onView={() => {
                                        if (formData.uploadedFile?.filename) {
                                            const token = localStorage.getItem('stardust_token');
                                            window.open(`${API}/uploads/${formData.uploadedFile.filename}?token=${token}`, '_blank');
                                        }
                                    }}
                            />
                        </div>
                    </SectionCard>
                );

            case 'Nominee':
                return (
                    <SectionCard title="Legacy Contact Info" icon={UserPlus}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Full Legal Name" />
                            <DropdownSelector
                                label="Relationship"
                                options={['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Lawyer', 'Advisor']}
                            />
                            <InputField label="Phone Number" />
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex flex-col space-y-4">
                            <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Linked Assets (Multi-select View)</label>
                            <div className="flex flex-wrap gap-2">
                                {['HDFC Bank', 'Tesla Equity', 'Bengaluru Property', 'MetLife Policy'].map(asset => (
                                    <button key={asset} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                                        + {asset}
                                    </button>
                                ))}
                            </div>
                            <button className="text-blue-600 text-[11px] font-bold underline text-left">Manage Access Rights Logic</button>
                        </div>
                    </SectionCard>
                );

            case 'Password':
                return (
                    <SectionCard title="Credential Details" icon={Lock}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Site Name"
                                required
                                placeholder="e.g. Netflix / HDFC Bank"
                                value={formData.siteName || ''}
                                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                            />
                            <InputField
                                label="Website URL"
                                placeholder="https://example.com"
                                value={formData.url || ''}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            />
                            <InputField
                                label="Username / Email"
                                placeholder="e.g. john@example.com"
                                value={formData.username || ''}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <div className="space-y-1.5 w-full">
                                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={formData._showPass ? 'text' : 'password'}
                                        className="input-field pr-12"
                                        placeholder="••••••••"
                                        value={formData.password || ''}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, _showPass: !formData._showPass })}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                                    >
                                        {formData._showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex flex-col space-y-4">
                            <DropdownSelector
                                label="Category Tag"
                                options={['Banking', 'Entertainment', 'Social', 'Work', 'Healthcare']}
                                value={formData.type || ''}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            />
                        </div>
                    </SectionCard>
                );

            case 'Contact':
                return (
                    <SectionCard title="Contact Details" icon={UserPlus}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Full Name"
                                required
                                placeholder="e.g. Ramesh Kumar"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <DropdownSelector
                                label="Relationship"
                                required
                                options={['Family', 'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Lawyer', 'CA / Accountant', 'Financial Advisor', 'Other']}
                                value={formData.relationship || ''}
                                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                            />
                            <InputField
                                label="Phone Number"
                                placeholder="e.g. +91 98765 43210"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <DropdownSelector
                                label="Role / Purpose"
                                options={['Emergency Contact', 'Legal Heir', 'Power of Attorney', 'Executor', 'Trusted Advisor', 'Other']}
                                value={formData.role || ''}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                    </SectionCard>
                );

            default:
                return null;
        }
    };

    return (
        <FormLayoutWrapper
            title={initialData?.asset_id ? `Update ${category}` : `New ${category} Vault Registry`}
            description={initialData?.asset_id ? `Modifying secure metadata for ${initialData.title}` : `Initialize end-to-end encryption for your ${category} assets.`}
            onSave={handleSave}
            onCancel={onCancel}
            isSaving={isSaving}
            shake={shake}
            glow={glow}
            disableSave={!termsAccepted}
        >
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3 mb-2">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Privacy First:</strong> We do not collect full account numbers or CVVs. Your data is client-side encrypted before it touches our secure vault nodes.
                </p>
            </div>

            <div className="space-y-8">
                {renderCategoryForm()}

                {/* CUSTOM USER FIELDS */}
                <SectionCard title="Custom Fields" icon={Layers}>
                    <p className="text-xs text-[var(--text-secondary)] mb-4">Add up to 5 custom fields with your own labels and values.</p>
                    <div className="space-y-3">
                        {customFields.map((field, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Field name"
                                    value={field.label}
                                    onChange={(e) => {
                                        const updated = [...customFields];
                                        updated[idx].label = e.target.value;
                                        setCustomFields(updated);
                                    }}
                                    className="input-field flex-1"
                                />
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={field.value}
                                    onChange={(e) => {
                                        const updated = [...customFields];
                                        updated[idx].value = e.target.value;
                                        setCustomFields(updated);
                                    }}
                                    className="input-field flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {customFields.length < 5 && (
                        <button
                            type="button"
                            onClick={() => setCustomFields([...customFields, { label: '', value: '' }])}
                            className="mt-4 flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl hover:bg-[var(--primary)]/10 transition-colors uppercase tracking-widest"
                        >
                            <Plus size={14} />
                            <span>Add Custom Field ({customFields.length}/5)</span>
                        </button>
                    )}
                </SectionCard>

                <SectionCard title="Additional Context" icon={Layers}>
                    <textarea
                        className="input-field min-h-[120px] py-4"
                        placeholder="Add optional notes or descriptions for your heirs..."
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </SectionCard>

                {/* TERMS & CONDITIONS */}
                <div className="flex items-start space-x-3 p-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl">
                    <input
                        type="checkbox"
                        id="tnc-checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <label htmlFor="tnc-checkbox" className="text-sm text-[var(--text-secondary)] cursor-pointer">
                        I agree to the Terms & Conditions and acknowledge that I am responsible for the accuracy of this data. I understand that false metadata might lead to account restrictions.
                    </label>
                </div>
            </div>
        </FormLayoutWrapper>
    );
};

export default UniversalVaultForm;
