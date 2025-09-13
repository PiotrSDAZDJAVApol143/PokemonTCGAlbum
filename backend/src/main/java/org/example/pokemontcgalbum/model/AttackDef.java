package org.example.pokemontcgalbum.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "attack_def", uniqueConstraints = @UniqueConstraint(columnNames = "canonicalKey"))
public class AttackDef extends BaseDef {
    @Column(name = "damage_text", length = 32)
    private String damageText;
}
