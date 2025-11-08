import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AssessmentStepper from '../components/AssessmentStepper';
import { State, City } from 'country-state-city';

// A list of major countries with their ISO codes
const majorCountries = [
  { name: 'Select your country', isoCode: '' }, 
  { name: 'India', isoCode: 'IN' },
  { name: 'United States', isoCode: 'US' },
  { name: 'United Kingdom', isoCode: 'GB' },
  { name: 'Canada', isoCode: 'CA' },
  { name: 'Australia', isoCode: 'AU' },
  { name: 'Germany', isoCode: 'DE' },
  { name: 'France', isoCode: 'FR' },
  { name: 'Japan', isoCode: 'JP' },
  { name: 'China', isoCode: 'CN' },
  { name: 'Brazil', isoCode: 'BR' },
];

function IntroductoryFormPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Prefer not to say',
    education_level: '',
    country: '', // Default to empty
    state: '',
    city: '',
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- THIS LOGIC IS NOW FIXED ---

  // Effect 1: Load states ONLY if India is selected
  useEffect(() => {
    if (formData.country === 'India') {
      setStates(State.getStatesOfCountry('IN'));
    } else {
      setStates([]); // Clear states if country is not India
    }
  }, [formData.country]); // Correct: Only depends on country

  // Effect 2: Pre-fill the form ONCE when user data loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
        lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        age: user.age || '',
        gender: user.gender || 'Prefer not to say',
        education_level: user.education_level || '',
        country: user.country || '', // Pre-fill country
        state: user.state || '',   // Pre-fill state text
        city: user.city || '',   // Pre-fill city text
      }));
      // This will trigger Effect 1 if user.country is 'India'
    }
  }, [user]); // Correct: Only depends on the user object

  // Effect 3: Pre-select dropdowns if the pre-filled country was India
  useEffect(() => {
    // Only run if country is India, states are loaded, and a state name exists
    if (formData.country === 'India' && states.length > 0 && formData.state) {
      const userState = states.find(s => s.name === formData.state);
      if (userState) {
        const stateCode = userState.isoCode;
        setSelectedStateCode(stateCode);
        setCities(City.getCitiesOfState('IN', stateCode));
        // formData.city is already set, so city dropdown will pre-select
      }
    }
    // We add formData.state as a dependency to run this *after* Effect 2 finishes
  }, [states, formData.state, formData.country]); 

  // --- END OF FIXED LOGIC ---


  // Generic handler for most inputs (now handles text state/city)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler for the COUNTRY dropdown
  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    
    // Reset all location fields when country changes
    setFormData({
      ...formData,
      country: countryName,
      state: '', 
      city: '',
    });
    setSelectedStateCode('');
    setCities([]);
  };

  // Handler for the (India-only) STATE dropdown
  const handleStateChange = (e) => {
    const stateIsoCode = e.target.value;
    setSelectedStateCode(stateIsoCode);
    
    const stateObj = states.find(s => s.isoCode === stateIsoCode);
    setCities(City.getCitiesOfState('IN', stateIsoCode));
    
    setFormData({
      ...formData,
      state: stateObj ? stateObj.name : '',
      city: '', // Reset city when state changes
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const profileData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        age: Number(formData.age) || null,
      };
      
      await updateProfile(profileData);
      
      navigate('/career-assessment'); 

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save details');
    } finally {
      setLoading(false);
    }
  };
  
  const inputStyle = "relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AssessmentStepper currentStep={1} />
      
      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tell us a bit about yourself. This information will be used to
          provide you with personalized career recommendations.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          {error && <div className="mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700 dark:bg-red-200">{error}</div>}
          
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            {/* --- Unchanged Fields --- */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input type="text" name="firstName" id="firstName" required className={inputStyle}
                     value={formData.firstName} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input type="text" name="lastName" id="lastName" required className={inputStyle}
                     value={formData.lastName} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
              <input type="number" name="age" id="age" required className={inputStyle}
                     value={formData.age} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
              <select id="gender" name="gender" className={inputStyle}
                      value={formData.gender} onChange={handleChange}>
                <option>Prefer not to say</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Education Level</label>
              <select id="education_level" name="education_level" required className={inputStyle}
                      value={formData.education_level} onChange={handleChange}>
                <option value="" disabled>Select your education</option>
                <option>High School</option>
                <option>Some College</option>
                <option>Associate's Degree</option>
                <option>Bachelor's Degree</option>
                <option>Master's Degree</option>
                <option>Doctorate (Ph.D.)</option>
              </select>
            </div>

            {/* --- Country --- */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <select 
                id="country" 
                name="country" 
                required 
                className={inputStyle}
                value={formData.country} // Value is the country NAME
                onChange={handleCountryChange}
              >
                {majorCountries.map((country) => (
                  <option 
                    key={country.isoCode} 
                    value={country.isoCode === '' ? '' : country.name} // Use "" for placeholder
                    disabled={country.isoCode === ''}
                  >
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* --- State (Conditional) --- */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">State / Province</label>
              {formData.country === 'India' ? (
                // --- RENDER DROPDOWN FOR INDIA ---
                <select 
                  id="state" 
                  name="state" 
                  required 
                  className={inputStyle}
                  value={selectedStateCode} // The value is the ISO code
                  onChange={handleStateChange}
                >
                  <option value="" disabled>Select your state</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>
              ) : (
                // --- RENDER TEXT INPUT FOR OTHER COUNTRIES ---
                <input
                  type="text"
                  name="state"
                  id="state"
                  required
                  className={inputStyle}
                  value={formData.state} // Value is the text name
                  onChange={handleChange}
                />
              )}
            </div>

            {/* --- City (Conditional) --- */}
            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              {formData.country === 'India' ? (
                // --- RENDER DROPDOWN FOR INDIA ---
                <select 
                  id="city" 
                  name="city" 
                  required 
                  className={inputStyle}
                  value={formData.city} // The value is the city name
                  onChange={handleChange}
                  disabled={cities.length === 0} 
                >
                  <option value="" disabled>
                    {selectedStateCode ? 'Select your city' : 'Please select a state first'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              ) : (
                // --- RENDER TEXT INPUT FOR OTHER COUNTRIES ---
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  className={inputStyle}
                  value={formData.city} // Value is the text name
                  onChange={handleChange}
                />
              )}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {loading ? 'Saving...' : 'Next: Career Assessment →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IntroductoryFormPage;