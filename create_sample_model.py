#!/usr/bin/env python3
"""
Generate a sample scikit-learn model for testing the ML prediction API.
This creates a simple classifier that predicts placement based on CGPA and IQ.
"""

import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Generate sample data
np.random.seed(42)
n_samples = 1000

# Generate CGPA (0-10) and IQ (70-150) data
cgpa = np.random.uniform(0, 10, n_samples)
iq = np.random.uniform(70, 150, n_samples)

# Create a simple decision rule: placed if (CGPA > 6 and IQ > 100) or (CGPA > 8)
placed = ((cgpa > 6) & (iq > 100)) | (cgpa > 8)
placed = placed.astype(int)

# Combine features
X = np.column_stack([cgpa, iq])
y = placed

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a simple model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Test the model
accuracy = model.score(X_test, y_test)
print(f"Model accuracy: {accuracy:.2f}")

# Save the model
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Sample model.pkl created successfully!")
print("Features: [CGPA, IQ]")
print("Target: 1=Placed, 0=Not Placed")