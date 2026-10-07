"""
AIML Model Training Script for Student Placement Probability Predictor.
Generates realistic engineering campus placement dataset, trains an ensemble model,
evaluates cross-validation metrics, and serializes the pipeline to placement_predictor.pkl.
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report

FEATURE_NAMES = [
    "tenth_percentage",
    "twelfth_percentage",
    "cgpa",
    "active_backlogs",
    "sem7_sgpa",
    "sem6_sgpa",
    "skills_count",
    "projects_count",
    "certifications_count"
]


def generate_placement_dataset(n_samples: int = 2500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic training dataset mapping typical Indian engineering placement criteria.
    """
    np.random.seed(random_seed)

    # Academic features
    tenth_pct = np.clip(np.random.normal(loc=76.0, scale=11.0, size=n_samples), 50.0, 99.0)
    twelfth_pct = np.clip(np.random.normal(loc=74.0, scale=11.5, size=n_samples), 50.0, 99.0)

    # CGPA correlated with 10th and 12th
    base_cgpa = 0.04 * tenth_pct + 0.04 * twelfth_pct + np.random.normal(0, 0.7, n_samples)
    cgpa = np.clip(base_cgpa, 5.0, 9.9)

    # Semester SGPAs around CGPA with slight variance
    sem6_sgpa = np.clip(cgpa + np.random.normal(0.1, 0.5, n_samples), 4.5, 10.0)
    sem7_sgpa = np.clip(cgpa + np.random.normal(0.15, 0.5, n_samples), 4.5, 10.0)

    # Active Backlogs (inversely correlated with CGPA)
    backlog_prob = np.clip(1.2 - (cgpa / 8.0), 0.05, 0.8)
    has_backlog = np.random.binomial(1, backlog_prob)
    active_backlogs = has_backlog * np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.6, 0.25, 0.1, 0.05])

    # Skills, Projects, Certifications (0 to 12)
    skills_count = np.clip(np.random.poisson(lam=4.5, size=n_samples), 0, 15)
    projects_count = np.clip(np.random.poisson(lam=2.2, size=n_samples), 0, 8)
    certifications_count = np.clip(np.random.poisson(lam=1.3, size=n_samples), 0, 6)

    # Calculate realistic Placement Logit Score
    # Weights:
    # - CGPA: major driver (+0.95 per point above 6.0)
    # - Backlogs: severe penalty (-1.65 per active backlog)
    # - Skills: +0.25 per skill
    # - Projects: +0.35 per project
    # - Certifications: +0.20 per cert
    # - 10th and 12th: +0.025 per %
    # - Sem 6/7: +0.25 per point
    z = (
        -4.2  # Intercept
        + 0.95 * (cgpa - 6.0)
        - 1.65 * active_backlogs
        + 0.25 * skills_count
        + 0.35 * projects_count
        + 0.20 * certifications_count
        + 0.025 * (tenth_pct - 60.0)
        + 0.025 * (twelfth_pct - 60.0)
        + 0.30 * (sem7_sgpa - 6.0)
        + 0.20 * (sem6_sgpa - 6.0)
        + np.random.normal(0, 0.6, n_samples)  # Random noise
    )

    # Sigmoid probability
    probabilities = 1.0 / (1.0 + np.exp(-z))
    placed = np.random.binomial(1, probabilities)

    df = pd.DataFrame({
        "tenth_percentage": np.round(tenth_pct, 2),
        "twelfth_percentage": np.round(twelfth_pct, 2),
        "cgpa": np.round(cgpa, 2),
        "active_backlogs": active_backlogs,
        "sem7_sgpa": np.round(sem7_sgpa, 2),
        "sem6_sgpa": np.round(sem6_sgpa, 2),
        "skills_count": skills_count,
        "projects_count": projects_count,
        "certifications_count": certifications_count,
        "placed": placed
    })

    return df


def train_and_export_model():
    print("=" * 60)
    print("Starting Placement Probability ML Model Training Pipeline")
    print("=" * 60)

    df = generate_placement_dataset(n_samples=2500, random_seed=42)
    placed_pct = df['placed'].mean() * 100
    print(f"[OK] Generated synthetic dataset with {len(df)} samples. Placement Rate: {placed_pct:.1f}%")

    X = df[FEATURE_NAMES]
    y = df["placed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Build pipeline: Standard Scaler + Gradient Boosting Ensemble
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", GradientBoostingClassifier(
            n_estimators=160,
            learning_rate=0.07,
            max_depth=4,
            subsample=0.85,
            random_state=42
        ))
    ])

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc")
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()
    print(f"[OK] 5-Fold Cross-Validation ROC-AUC: {cv_mean:.4f} (+/- {cv_std:.4f})")

    # Fit on training set
    pipeline.fit(X_train, y_train)

    # Test Evaluation
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print(f"[OK] Test Accuracy: {acc*100:.2f}%")
    print(f"[OK] Test F1-Score: {f1:.4f}")
    print(f"[OK] Test ROC-AUC:  {auc:.4f}")

    # Model export bundle
    export_payload = {
        "pipeline": pipeline,
        "feature_names": FEATURE_NAMES,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
            "cv_roc_auc_mean": round(float(cv_scores.mean()), 4)
        },
        "trained_at": datetime.now().isoformat(),
        "model_type": "GradientBoostingClassifier + StandardScaler"
    }

    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "placement_predictor.pkl")

    joblib.dump(export_payload, output_path)
    print(f"[OK] Model pipeline successfully serialized and saved to:\n  {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    train_and_export_model()
