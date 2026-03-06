import React, { useState } from 'react';
import {
    CreditCard,
    Building,
    Shield,
    Home,
    FileText,
    UserPlus,
    Lock,
    Eye,
    Calendar,
    Info,
    Layers,
    MapPin
} from 'lucide-react';
import { InputField, MaskedInput, CustomDropdownSelector } from './FormInputs';
import { SectionCard, ToggleSwitch } from './DisplayComponents';
import { FormLayoutWrapper, UploadComponent } from './FormLayout';

const UniversalVaultForm = ({ category, onSave, onCancel }) => {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [cardBenefits, setCardBenefits] = useState(null);
    const [isLoadingBenefits, setIsLoadingBenefits] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate real encryption/save
        setTimeout(() => {
            setIsSaving(false);
            onSave(formData);
        }, 1200);
    };

    const fetchCardBenefits = async () => {
        console.log("Button clicked - function started");

        if (!formData.bank || !formData.network) {
            console.log("Missing bank or network");
            return;
        }

        setIsLoadingBenefits(true);

        try {
            console.log("Sending request to backend...");

            const response = await fetch('http://127.0.0.1:5000/card-benefits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bank: formData.bank,
                    network: formData.network,
                    variant: formData.variant || ''
                })
            });

            console.log("Response received:", response.status);

            if (!response.ok) {
                throw new Error("Server returned error");
            }

            const data = await response.json();

            console.log("Parsed JSON FULL:", JSON.stringify(data, null, 2));


            if (data.benefits) {
                setCardBenefits(data.benefits);
            } else {
                setCardBenefits("No benefits returned from backend.");
            }

        } catch (error) {
            console.error("Fetch error:", error);
            setCardBenefits("Failed to load card benefits.");
        } finally {
            setIsLoadingBenefits(false);
        }
    };

    const renderCategoryForm = () => {
        switch (category) {
            case 'Credit Card':
                return (
                    <>
                        <SectionCard title="Card Metadata" icon={CreditCard}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomDropdownSelector
                                    label="Bank Name"
                                    options={['HDFC BANK', 'ICICI BANK', 'SBI', 'AXIS', 'AMEX']}
                                    value={formData.bank || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, bank: e.target.value });
                                        setCardBenefits(null); // Clear benefits when form changes
                                        console.log('Bank Name:', e.target.value);
                                        console.log('Form data:', { ...formData, bank: e.target.value });
                                    }}
                                />
                                <CustomDropdownSelector
                                    label="Card Network"
                                    options={['Visa', 'MasterCard', 'Amex', 'RuPay', 'Discover']}
                                    value={formData.network || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, network: e.target.value });
                                        setCardBenefits(null); // Clear benefits when form changes
                                        console.log('Card Network:', e.target.value);
                                        console.log('Form data after network:', { ...formData, network: e.target.value });
                                    }}
                                />
                                <InputField
                                    label="Card Variant"
                                    placeholder="e.g. Millennia / Regalia"
                                    onChange={(e) => {
                                        setFormData({ ...formData, variant: e.target.value });
                                        setCardBenefits(null); // Clear benefits when form changes
                                    }}
                                />
                                <MaskedInput
                                    label="Last 4 Digits"
                                    helperText="Privacy-first: We never store full card numbers."
                                    value={formData.last4 || ''}
                                    onChange={(val) => setFormData({ ...formData, last4: val })}
                                />
                            </div>
                        </SectionCard>
                        
                        {/* Get Benefits Button - Always visible for testing */}
                        <div className="flex justify-center mb-6">
                            <div className="text-center">
                                <button
                                    onClick={fetchCardBenefits}
                                    disabled={isLoadingBenefits || !formData.bank || !formData.network}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    {isLoadingBenefits ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Getting Benefits...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Info size={18} />
                                            <span>Get Card Benefits</span>
                                        </>
                                    )}
                                </button>
                                <div className="mt-2 text-xs text-gray-500">
                                    Debug: Bank="{formData.bank || 'empty'}" Network="{formData.network || 'empty'}"
                                </div>
                                {!formData.bank || !formData.network ? (
                                    <p className="text-xs text-red-500 mt-2">Please select both Bank Name and Card Network</p>
                                ) : (
                                    <p className="text-xs text-green-500 mt-2">Ready to fetch benefits!</p>
                                )}
                            </div>
                        </div>

                        {/* Card Benefits Display */}
                        {cardBenefits && (
                            <SectionCard title="Card Benefits" icon={Info} className="bg-green-50 border-green-200">
                                <div className="prose prose-sm max-w-none">
                                    <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
                                        {cardBenefits}
                                    </div>
                                </div>
                            </SectionCard>
                        )}
                        
                        {/* Debug Info */}
                        {cardBenefits && (
                            <div className="mt-4">
                                {/* Benefits are displayed above */}
                            </div>
                        )}
                        <SectionCard title="Billing & Lifecycle" icon={Calendar}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex space-x-4">
                                    <InputField label="Expiry Month" placeholder="MM" maxLength={2} />
                                    <InputField label="Expiry Year" placeholder="YYYY" maxLength={4} />
                                </div>
                                <InputField label="Billing Cycle Date" placeholder="e.g. 15th of Month" />
                                <CustomDropdownSelector label="Status" options={['Active', 'Issued', 'Closed']} />
                            </div>
                        </SectionCard>
                    </>
                );

            case 'Bank Account':
                return (
                    <>
                        <SectionCard title="Account Details" icon={Building}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomDropdownSelector
                                    label="Bank Name"
                                    options={['HDFC', 'ICICI', 'SBI', 'HSBC', 'KOTAK']}
                                />
                                <CustomDropdownSelector
                                    label="Account Type"
                                    options={['Savings', 'Current', 'Salary', 'Joint']}
                                />
                                <InputField label="Account Nickname" placeholder="Primary / Emergency" />
                                <MaskedInput
                                    label="Last 4 Digits"
                                    helperText="Only 4 digits are required for identification."
                                    value={formData.last4 || ''}
                                    onChange={(val) => setFormData({ ...formData, last4: val })}
                                />
                            </div>
                        </SectionCard>
                        <SectionCard title="Branch & Security" icon={MapPin}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="IFSC Code (Optional)" placeholder="HDFC0001234" />
                                <InputField label="Branch City" />
                                <ToggleSwitch
                                    label="Nominee Linked?"
                                    enabled={formData.nomineeLinked}
                                    onChange={(val) => setFormData({ ...formData, nomineeLinked: val })}
                                />
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
                                <CustomDropdownSelector
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
                                <InputField label="Property Title" placeholder="e.g. Bengaluru Dream House" />
                                <CustomDropdownSelector
                                    label="Property Type"
                                    options={['Residential', 'Commercial', 'Land', 'Apartment']}
                                />
                                <InputField label="City" />
                                <InputField label="State" />
                                <CustomDropdownSelector
                                    label="Ownership Type"
                                    options={['Self', 'Joint', 'Inherited']}
                                />
                                <InputField label="Registration Year" placeholder="YYYY" maxLength={4} />
                            </div>
                        </SectionCard>
                        <SectionCard title="Legal Documents" icon={FileText}>
                            <UploadComponent label="Upload Sale Deed / Registration Scan" />
                            <InputField label="Co-owner Details (Optional)" />
                        </SectionCard>
                    </>
                );

            case 'Legal Document':
                return (
                    <SectionCard title="Document Metadata" icon={FileText}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Document Name" placeholder="e.g. Last Will" />
                            <CustomDropdownSelector
                                label="Document Type"
                                options={['Will', 'Passport', 'Birth Cert', 'Marriage Cert', 'Other']}
                            />
                            <InputField label="Issuer" placeholder="e.g. Govt of India" />
                            <InputField label="Year Issued" placeholder="YYYY" maxLength={4} />
                        </div>
                        <div className="pt-6">
                            <UploadComponent label="Secure Binary Upload" />
                        </div>
                    </SectionCard>
                );

            case 'Nominee':
                return (
                    <SectionCard title="Legacy Contact Info" icon={UserPlus}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Full Legal Name" />
                            <CustomDropdownSelector
                                label="Relationship"
                                options={['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Lawyer', 'Advisor']}
                            />
                            <InputField label="Email Address" type="email" />
                            <InputField label="Phone Number" />
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex flex-col space-y-4">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Linked Assets (Multi-select View)</label>
                            <div className="flex flex-wrap gap-2">
                                {['HDFC Bank', 'Tesla Equity', 'Bengaluru Property', 'MetLife Policy'].map(asset => (
                                    <button key={asset} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all">
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
                            <InputField label="Site Name" placeholder="e.g. Netflix / HDFC Bank" />
                            <InputField label="Website URL" placeholder="https://example.com" />
                            <InputField label="Username / Email" />
                            <div className="space-y-1.5 w-full">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <input type="password" underline="none" className="input-field" placeholder="••••••••" />
                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-50 flex flex-col space-y-4">
                            <CustomDropdownSelector
                                label="Category Tag"
                                options={['Banking', 'Entertainment', 'Social', 'Work', 'Healthcare']}
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
            title={`Add ${category}`}
            description={`Enter basic metadata for your ${category.toLowerCase()}. No sensitive full identifiers needed.`}
            onSave={handleSave}
            onCancel={onCancel}
            isSaving={isSaving}
        >
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3 mb-2">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Privacy First:</strong> We do not collect full account numbers or CVVs. Your data is client-side encrypted before it touches our secure vault nodes.
                </p>
            </div>

            <div className="space-y-8">
                {renderCategoryForm()}

                <SectionCard title="Additional Context" icon={Layers}>
                    <textarea
                        className="input-field min-h-[120px] py-4"
                        placeholder="Add optional notes or descriptions for your heirs..."
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </SectionCard>
            </div>
        </FormLayoutWrapper>
    );
};

export default UniversalVaultForm;
