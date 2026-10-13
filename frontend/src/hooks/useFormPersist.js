import { useState, useEffect, useCallback } from "react";

export function useFormPersist(storageKey, initialValues) {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialValues;
    } catch {
      return initialValues;
    }
  });

  const [isDirty, setIsDirty] = useState(false);

  // Auto-save to localStorage on input change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      setIsDirty(true);
    } catch (e) {
      console.error("LocalStorage write error", e);
    }
  }, [storageKey, formData]);

  // Browser reload / close alert guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    localStorage.removeItem(storageKey);
    setFormData(initialValues);
    setIsDirty(false);
  }, [storageKey, initialValues]);

  return {
    formData,
    setFormData,
    handleChange,
    updateField,
    resetForm,
    isDirty,
    setIsDirty,
  };
}