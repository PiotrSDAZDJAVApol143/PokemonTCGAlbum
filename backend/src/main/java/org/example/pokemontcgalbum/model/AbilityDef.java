package org.example.pokemontcgalbum.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "ability_def", uniqueConstraints = @UniqueConstraint(columnNames = "canonicalKey"))
public class AbilityDef extends BaseDef {}
